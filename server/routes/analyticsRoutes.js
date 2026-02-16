const express = require("express");
const { getAnalyticsClient, getPropertyId } = require("../services/analyticsClient");
const auth = require("../middleware/auth");

const router = express.Router();

const ensureConfigured = () => {
  const propertyId = getPropertyId();
  if (!propertyId) {
    const err = new Error("GA property is not configured.");
    err.status = 400;
    throw err;
  }
  return propertyId;
};

router.get("/overview", auth, async (req, res) => {
  try {
    const propertyId = ensureConfigured();
    const client = getAnalyticsClient();

    const [summaryResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [
        { name: "totalUsers" },
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
    });

    const [conversionsResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: {
            matchType: "EXACT",
            value: "contact_submit",
          },
        },
      },
      limit: 1,
    });

    const [countriesResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "country" }],
      metrics: [{ name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
      limit: 5,
    });

    const [pagesResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 5,
    });

    const summaryRow = summaryResponse.rows?.[0]?.metricValues || [];
    const conversionsRow = conversionsResponse.rows?.[0]?.metricValues || [];
    const summary = {
      totalUsers: Number(summaryRow[0]?.value || 0),
      activeUsers: Number(summaryRow[1]?.value || 0),
      sessions: Number(summaryRow[2]?.value || 0),
      pageViews: Number(summaryRow[3]?.value || 0),
      conversions: Number(conversionsRow[0]?.value || 0),
    };

    const topCountries = (countriesResponse.rows || []).map((row) => ({
      name: row.dimensionValues?.[0]?.value || "-",
      users: Number(row.metricValues?.[0]?.value || 0),
    }));

    const topPages = (pagesResponse.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || "-",
      views: Number(row.metricValues?.[0]?.value || 0),
    }));

    return res.json({ summary, topCountries, topPages });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || "Failed to fetch analytics" });
  }
});

module.exports = router;
