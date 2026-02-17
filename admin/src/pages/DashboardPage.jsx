import { useEffect, useMemo, useState } from "react";
import API_BASE_URL, { api, tokenStore } from "../api/client";
import { productData as defaultProductCatalog } from "../defaults/productCatalog";
const API_ORIGIN = API_BASE_URL.replace("/api", "");
const parseAdminFromToken = () => {
  try {
    const token = tokenStore.get();
    if (!token) return {};
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return payload || {};
  } catch {
    return {};
  }
};

const resolveImageUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/uploads/")) return `${API_ORIGIN}${value}`;
  if (value.startsWith("/assets/")) {
    const fileName = value.split("/").pop();
    return `${API_ORIGIN}/uploads/${fileName}`;
  }
  if (!value.startsWith("/")) return `${API_ORIGIN}/uploads/${value}`;
  return `${API_ORIGIN}${value}`;
};

const fallbackSegments = [
  {
    id: "pharmaceuticals",
    name: "Pharmaceuticals",
    image: "/assets/segment_pharma_1769615897321.png",
    description: "Regulatory-compliant packaging solutions ensuring safety, hygiene, and precision.",
    tag: "Industry Standard",
  },
  {
    id: "nutraceuticals",
    name: "Nutraceuticals",
    image: "/assets/segment_nutra_1769616067190.png",
    description: "Protective packaging for supplements combining shelf appeal with safety.",
    tag: "Health & Wellness",
  },
  {
    id: "cosmetics",
    name: "Cosmetics",
    image: "/assets/pharma_banner_bottles_1769614352905.png",
    description: "Aesthetically pleasing and functional containers for beauty and personal care.",
    tag: "Premium Design",
  },
  {
    id: "fmcg",
    name: "FMCG",
    image: "/assets/pharma_banner_production_retry_1769615616299.png",
    description: "Durable, cost-effective packaging solutions for fast-moving consumer goods.",
    tag: "High Volume",
  },
];

const fallbackOurSegments = [
  {
    id: "pharma",
    title: "Pharmaceuticals",
    image: "/assets/segment_pharma_1769615897321.png",
    description:
      "We provide regulatory-compliant packaging solutions for the pharmaceutical industry, ensuring safety, hygiene, and precision.",
    features: ["USFDA Compliant Materials", "Clean Room Manufacturing", "Child-Resistant Options"],
  },
  {
    id: "nutra",
    title: "Nutraceuticals",
    image: "/assets/segment_nutra_1769616067190.png",
    description:
      "Our packaging for nutraceuticals and supplements combines protection with shelf appeal.",
    features: ["UV Protection", "Tamper-Evident Seals", "Custom Colors"],
  },
  {
    id: "cosmetics",
    title: "Cosmetics",
    image: "/assets/pharma_banner_bottles_1769614352905.png",
    description:
      "Premium packaging solutions for the beauty and personal care industry with elegant, functional containers.",
    features: ["High-Quality Finish", "Custom Shapes", "Brand Customization"],
  },
  {
    id: "fmcg",
    title: "FMCG",
    image: "/assets/pharma_banner_production_retry_1769615616299.png",
    description:
      "Durable and cost-effective packaging for fast-moving consumer goods across household and food products.",
    features: ["High Volume Production", "Cost-Effective", "Durable Design"],
  },
];

const fallbackSlides = [
  {
    id: 1,
    image: "/assets/pharma_banner_bottles_1769614352905.png",
    title: "Your Trusted Partner in",
    subtitle: "Plastic Packaging Excellence",
    text: "Premium pharmaceutical and cosmetic packaging solutions meeting international standards.",
  },
  {
    id: 2,
    image: "/assets/pharma_banner_production_retry_1769615616299.png",
    title: "Advanced Manufacturing",
    subtitle: "State-of-the-Art Technology",
    text: "Precision engineering and clean-room facilities ensuring highest hygiene standards.",
  },
  {
    id: 3,
    image: "/assets/pharma_banner_caps_retry_1769615514861.png",
    title: "Innovative Solutions",
    subtitle: "Custom Caps & Closures",
    text: "Tailored designs to enhance brand identity and ensure product safety.",
  },
];

const emptyMarket = { id: "", name: "", image: "", description: "", tag: "" };
const emptyOurSegment = { id: "", title: "", image: "", description: "", features: "" };
const emptySlide = { id: "", image: "", title: "", subtitle: "", text: "" };
const emptyContactContent = {
  pageTitle: "Contact Us",
  pageDescription: "Get in touch for quotes, product inquiries, and custom manufacturing solutions.",
  infoHeading: "Get in Touch",
  infoSubheading: "Our team is ready to assist you with your packaging requirements.",
  mapTitle: "Headquarters",
  phoneTitle: "Phone",
  emailTitle: "Email",
  contactInfo: {
    phone: "9000386555",
    whatsapp: "919000386555",
    email: "info@aethonplast.com",
    address: "AGM Chambers, 390/A, 446/15/E, Sai Colony, R.C Puram, Sangareddy District, 502032, Telangana",
    mapLink: "https://maps.app.goo.gl/rFa3mJ4pW65ThcCu7",
  },
  subjects: ["Product Inquiry", "Custom Mold Request", "Other"],
};
const emptyHomeExtra = {
  features: [
    {
      id: "feature_1",
      title: "Pharma Grade",
      text: "Strict adherence to hygiene and regulatory compliance for medical packaging.",
    },
    {
      id: "feature_2",
      title: "Custom Molding",
      text: "Tailored shapes and designs to make your brand stand out on the shelf.",
    },
    {
      id: "feature_3",
      title: "Quality Assured",
      text: "Rigorous testing and quality control processes for consistent durability.",
    },
  ],
  aboutPreview: {
    title: "Reliable Manufacturing Partner",
    description:
      "At Aethon Plast, we combine advanced technology with manufacturing expertise to deliver superior packaging solutions. From startups to enterprises, we enable growth through quality.",
    buttonText: "Learn More",
    stats: [
      { value: "0+", label: "Units/Month" },
      { value: "0+", label: "Clients" },
    ],
  },
};
const emptyAboutContent = {
  pageTitle: "About Us",
  pageDescription:
    "We are committed to delivering reliable, compliant, and cost-effective packaging products.",
  whoWeAreTitle: "Who We Are",
  whoWeAreHighlight:
    "Aethon Plast Pvt Ltd is a premier manufacturer of high-quality plastic packaging solutions based in Hyderabad, Telangana.",
  whoWeAreParagraphOne:
    "We specialize in serving the pharmaceutical, cosmetic, healthcare, and FMCG industries with precision-molded HDPE, LDPE, and PET containers. Our facility is designed to support scalable production, catering to everyone from innovative startups to established large enterprises.",
  whoWeAreParagraphTwo:
    "Quality and compliance are at the core of our operations. We follow strict quality control processes and hygienic manufacturing practices to ensure product safety, durability, and performance.",
  visionTitle: "Our Vision",
  visionText:
    "To become a globally trusted partner in plastic packaging through innovation and operational excellence.",
  missionTitle: "Our Mission",
  missionText:
    "To provide compliant, high-quality, and cost-effective packaging solutions that support our clients' growth.",
};
const emptyProductsPageContent = {
  headerTitle: "Market Segments",
  headerDescription: "Explore our specialized packaging solutions across key industries.",
  ctaTitle: "Need a Custom Solution?",
  ctaDescription: "We specialize in custom molding to meet your specific requirements.",
  ctaButtonText: "Contact Us",
};
const emptyOurSegmentsPageContent = {
  headerTitle: "Our Segments",
  headerDescription: "Delivering excellence across diverse industries with tailored packaging solutions.",
};
const emptyEmailSettings = {
  contactRecipients: "",
  contactFromEmail: "",
  contactFromName: "",
  smtpHost: "",
  smtpPort: "",
  smtpSecure: "false",
  smtpUser: "",
  smtpPass: "",
};
const emptySiteSettings = {
  companyName: "Aethon Plast Pvt Ltd",
  logoPath: "/transperent aethon.png",
  logoAlt: "Aethon Plast",
  footerDescription:
    "Leading manufacturer of high-quality plastic packaging solutions. We serve industries globally with innovation and integrity.",
  socialLinks: {
    FACEBOOK: "https://www.facebook.com/share/188jqYEmBX/",
    INSTAGRAM: "https://instagram.com",
    LINKEDIN: "https://www.linkedin.com/company/aethon-plast/",
  },
  developerName: "@Semixon",
  developerUrl: "https://semixon.com",
};
const emptyCatalogItem = {
  id: "",
  name: "",
  actualName: "",
  subCategory: "",
  image: "",
  description: "",
  features: "",
};
const flattenCatalogItems = (catalog) => {
  const rows = [];
  Object.values(catalog || {}).forEach((industry) => {
    Object.entries(industry?.categories || {}).forEach(([categoryKey, category]) => {
      Object.entries(category?.subCategories || {}).forEach(([subKey, sub]) => {
        (sub?.items || []).forEach((item) => {
          rows.push({
            id: item.id,
            name: item.name || item.actualName || "",
            description: item.description || "",
            image: item.image || "",
            industry: industry?.title || "",
            category: category?.title || categoryKey,
            subCategory: sub?.title || subKey,
          });
        });
      });
    });
  });
  return rows;
};
const toKey = (raw) =>
  String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const mergeSlides = (incoming = [], fallback = []) => {
  const safeIncoming = Array.isArray(incoming) ? incoming : [];
  const safeFallback = Array.isArray(fallback) ? fallback : [];
  if (safeIncoming.length === 0) return safeFallback;
  const merged = safeFallback.map((fb) => {
    const match = safeIncoming.find((slide) => String(slide.id) === String(fb.id));
    if (!match) return fb;
    return {
      ...fb,
      ...match,
      image: match.image && String(match.image).trim() ? match.image : fb.image,
      title: match.title && String(match.title).trim() ? match.title : fb.title,
      subtitle: match.subtitle && String(match.subtitle).trim() ? match.subtitle : fb.subtitle,
      text: match.text && String(match.text).trim() ? match.text : fb.text,
    };
  });
  const extras = safeIncoming.filter(
    (slide) => !safeFallback.find((fb) => String(fb.id) === String(slide.id))
  );
  return merged.concat(extras);
};

const DashboardPage = () => {
  const [active, setActive] = useState("homeSlides");
  const [productsView, setProductsView] = useState("segments");
  const [message, setMessage] = useState("");

  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [contentEntries, setContentEntries] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);

  const [userForm, setUserForm] = useState({ id: "", name: "", email: "" });
  const [productForm, setProductForm] = useState({ id: "", name: "", description: "", price: "", image: null });
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });

  const [marketSegments, setMarketSegments] = useState(fallbackSegments);
  const [marketForm, setMarketForm] = useState(emptyMarket);

  const [ourSegments, setOurSegments] = useState(fallbackOurSegments);
  const [ourSegmentForm, setOurSegmentForm] = useState(emptyOurSegment);

  const [homeSlides, setHomeSlides] = useState(fallbackSlides);
  const [slideForm, setSlideForm] = useState(emptySlide);
  const [homeExtra, setHomeExtra] = useState(emptyHomeExtra);

  const [aboutContent, setAboutContent] = useState(emptyAboutContent);
  const [contactContent, setContactContent] = useState(emptyContactContent);
  const [productsPageContent, setProductsPageContent] = useState(emptyProductsPageContent);
  const [ourSegmentsPageContent, setOurSegmentsPageContent] = useState(emptyOurSegmentsPageContent);
  const [emailSettings, setEmailSettings] = useState(emptyEmailSettings);
  const [emailTestTo, setEmailTestTo] = useState("");
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [editingRecipient, setEditingRecipient] = useState("");
  const [editingRecipientValue, setEditingRecipientValue] = useState("");
  const [emailErrors, setEmailErrors] = useState({});
  const [analyticsData, setAnalyticsData] = useState({ summary: null, topCountries: [], topPages: [] });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [siteSettings, setSiteSettings] = useState(emptySiteSettings);

  const [catalogText, setCatalogText] = useState(
    JSON.stringify(defaultProductCatalog, null, 2)
  );
  const [catalogIndustryKey, setCatalogIndustryKey] = useState("");
  const [catalogCategoryKey, setCatalogCategoryKey] = useState("");
  const [catalogSubKey, setCatalogSubKey] = useState("");
  const [catalogItemForm, setCatalogItemForm] = useState(emptyCatalogItem);
  const [editingCatalogItemId, setEditingCatalogItemId] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showCatalogSummaryTable, setShowCatalogSummaryTable] = useState(false);
  const [newIndustryKey, setNewIndustryKey] = useState("");
  const [newIndustryTitle, setNewIndustryTitle] = useState("");
  const [newCategoryKey, setNewCategoryKey] = useState("");
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newSubKey, setNewSubKey] = useState("");
  const [newSubTitle, setNewSubTitle] = useState("");
  const [visitorSearch, setVisitorSearch] = useState("");
  const [visitorPage, setVisitorPage] = useState(1);
  const VISITOR_PAGE_SIZE = 10;
  const currentAdmin = useMemo(() => parseAdminFromToken(), []);
  const currentAdminEmail = String(currentAdmin?.email || "").toLowerCase();
  const sectionTitleMap = {
    homeSlides: "Home",
    admins: "Admins",
    leads: "Leads",
    products: "Products",
    ourSegments: "Our Segments",
    about: "About",
    contact: "Contact",
    email: "Email Settings",
    analytics: "Analytics",
    site: "Site Settings",
    media: "Media Library",
  };

  const contentByKey = useMemo(() => {
    const map = {};
    contentEntries.forEach((entry) => {
      map[entry.key] = entry;
    });
    return map;
  }, [contentEntries]);

  const catalogObject = useMemo(() => {
    try {
      return JSON.parse(catalogText);
    } catch {
      return defaultProductCatalog;
    }
  }, [catalogText]);

  const catalogItems = useMemo(() => flattenCatalogItems(catalogObject), [catalogObject]);
  const industryKeys = useMemo(() => Object.keys(catalogObject || {}), [catalogObject]);
  const selectedIndustry = catalogObject?.[catalogIndustryKey] || null;
  const categoryEntries = Object.entries(selectedIndustry?.categories || {});
  const selectedCategory = selectedIndustry?.categories?.[catalogCategoryKey] || null;
  const subEntries = Object.entries(selectedCategory?.subCategories || {});
  const selectedSub = selectedCategory?.subCategories?.[catalogSubKey] || null;
  const isCatalogTargetReady = Boolean(catalogIndustryKey && catalogCategoryKey && catalogSubKey);
  const catalogTargetPath = `${selectedIndustry?.title || "-"} / ${selectedCategory?.title || "-"} / ${selectedSub?.title || "-"}`;
  const selectedSubItems = selectedSub?.items || [];
  const filteredVisitors = useMemo(() => {
    const q = visitorSearch.trim().toLowerCase();
    if (!q) return visitors;
    return visitors.filter((v) =>
      [
        v.sessionId,
        v.ip,
        v.lastPath,
        v.userAgent,
        ...(v.pages || []),
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [visitors, visitorSearch]);
  const visitorPagesCount = Math.max(1, Math.ceil(filteredVisitors.length / VISITOR_PAGE_SIZE));
  const pagedVisitors = filteredVisitors.slice(
    (visitorPage - 1) * VISITOR_PAGE_SIZE,
    visitorPage * VISITOR_PAGE_SIZE
  );
  const selectedSubItemsFiltered = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return selectedSubItems;
    return selectedSubItems.filter((item) =>
      [
        item.id,
        item.name,
        item.actualName,
        item.description,
        item.subCategory,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [selectedSubItems, catalogSearch]);

  const updateCatalogObject = (mutator) => {
    let next;
    try {
      next = structuredClone(catalogObject);
    } catch {
      next = JSON.parse(JSON.stringify(catalogObject));
    }
    mutator(next);
    setCatalogText(JSON.stringify(next, null, 2));
  };

  const loadAll = async () => {
    const [adminsResult, usersResult, visitorsResult, leadsResult, productsResult, contentResult, mediaResult] = await Promise.allSettled([
      api.getAdmins(),
      api.getUsers(),
      api.getVisitors(),
      api.getLeads(),
      api.getProducts(),
      api.getContent(),
      api.getMedia(),
    ]);

    if (adminsResult.status === "fulfilled") {
      setAdmins(Array.isArray(adminsResult.value?.admins) ? adminsResult.value.admins : []);
    }
    if (usersResult.status === "fulfilled") setUsers(usersResult.value);
    if (visitorsResult.status === "fulfilled") {
      setVisitors(visitorsResult.value);
    } else {
      setMessage("Visitors tracking API unavailable. Restart backend from /server.");
    }
    if (leadsResult.status === "fulfilled") {
      setLeads(Array.isArray(leadsResult.value) ? leadsResult.value : []);
    } else {
      setMessage("Leads API unavailable. Restart backend from /server.");
    }
    if (productsResult.status === "fulfilled") setProducts(productsResult.value);
    if (contentResult.status === "fulfilled") {
      setContentEntries(contentResult.value);
    } else {
      setMessage("Content API unavailable. Run backend from project /server for full content CRUD.");
    }
    if (mediaResult.status === "fulfilled") setMediaFiles(mediaResult.value);
  };

  useEffect(() => {
    loadAll().catch((error) => setMessage(error.message || "Failed to load dashboard"));
  }, []);

  useEffect(() => {
    if (active !== "analytics") return;
    setAnalyticsLoading(true);
    setAnalyticsError("");
    api.getAnalyticsOverview()
      .then((data) => {
        setAnalyticsData({
          summary: data.summary || null,
          topCountries: Array.isArray(data.topCountries) ? data.topCountries : [],
          topPages: Array.isArray(data.topPages) ? data.topPages : [],
        });
      })
      .catch((error) => {
        setAnalyticsError(error.message || "Failed to load analytics.");
      })
      .finally(() => setAnalyticsLoading(false));
  }, [active]);

  useEffect(() => {
    if (contentByKey.marketSegments?.data) setMarketSegments(contentByKey.marketSegments.data);
    if (contentByKey.ourSegments?.data) {
      const incoming = Array.isArray(contentByKey.ourSegments.data)
        ? contentByKey.ourSegments.data
        : [];
      const incomingMap = new Map(incoming.map((item) => [String(item.id), item]));
      const merged = fallbackOurSegments.map((item) => incomingMap.get(String(item.id)) || item);
      const extra = incoming.filter(
        (item) => !fallbackOurSegments.some((base) => String(base.id) === String(item.id))
      );
      setOurSegments([...merged, ...extra]);
    }
    if (contentByKey.homePage?.data) {
      const incoming = contentByKey.homePage.data;
      if (Array.isArray(incoming.slides) && incoming.slides.length) {
        setHomeSlides(mergeSlides(incoming.slides, fallbackSlides));
      }
      setHomeExtra({
        ...emptyHomeExtra,
        ...incoming,
        features:
          Array.isArray(incoming.features) && incoming.features.length
            ? incoming.features
            : emptyHomeExtra.features,
        aboutPreview: {
          ...emptyHomeExtra.aboutPreview,
          ...(incoming.aboutPreview || {}),
          stats:
            Array.isArray(incoming.aboutPreview?.stats) && incoming.aboutPreview.stats.length
              ? incoming.aboutPreview.stats
              : emptyHomeExtra.aboutPreview.stats,
        },
      });
    }
    if (contentByKey.aboutPage?.data) {
      setAboutContent({ ...emptyAboutContent, ...contentByKey.aboutPage.data });
    }
    if (contentByKey.contactPage?.data) {
      const incoming = contentByKey.contactPage.data;
      setContactContent({
        ...emptyContactContent,
        ...incoming,
        contactInfo: {
          ...emptyContactContent.contactInfo,
          ...(incoming.contactInfo || {}),
        },
        subjects:
          Array.isArray(incoming.subjects) && incoming.subjects.length
            ? incoming.subjects
            : emptyContactContent.subjects,
      });
    }
    if (contentByKey.emailSettings?.data) {
      const incoming = contentByKey.emailSettings.data || {};
      setEmailSettings((prev) => ({
        ...emptyEmailSettings,
        ...prev,
        ...incoming,
        contactRecipients: incoming.contactRecipients ?? prev.contactRecipients ?? "",
        contactFromEmail: incoming.contactFromEmail ?? prev.contactFromEmail ?? "",
        contactFromName: incoming.contactFromName ?? prev.contactFromName ?? "",
        smtpHost: incoming.smtpHost ?? prev.smtpHost ?? "",
        smtpPort: incoming.smtpPort ?? prev.smtpPort ?? "",
        smtpSecure: incoming.smtpSecure ?? prev.smtpSecure ?? "false",
        smtpUser: incoming.smtpUser ?? prev.smtpUser ?? "",
        smtpPass: incoming.smtpPass ?? prev.smtpPass ?? "",
      }));
    }
    if (contentByKey.productsPage?.data) {
      setProductsPageContent({
        ...emptyProductsPageContent,
        ...contentByKey.productsPage.data,
      });
    }
    if (contentByKey.ourSegmentsPage?.data) {
      setOurSegmentsPageContent({
        ...emptyOurSegmentsPageContent,
        ...contentByKey.ourSegmentsPage.data,
      });
    }
    if (contentByKey.siteSettings?.data) {
      const incoming = contentByKey.siteSettings.data;
      setSiteSettings({
        ...emptySiteSettings,
        ...incoming,
        socialLinks: {
          ...emptySiteSettings.socialLinks,
          ...(incoming.socialLinks || {}),
        },
      });
    }
    if (contentByKey.productCatalog?.data) {
      setCatalogText(JSON.stringify(contentByKey.productCatalog.data, null, 2));
    } else {
      setCatalogText(JSON.stringify(defaultProductCatalog, null, 2));
    }
  }, [contentByKey]);

  useEffect(() => {
    if (!industryKeys.length) return;
    if (!catalogIndustryKey || !catalogObject[catalogIndustryKey]) {
      setCatalogIndustryKey(industryKeys[0]);
    }
  }, [industryKeys, catalogIndustryKey, catalogObject]);

  useEffect(() => {
    const keys = Object.keys(selectedIndustry?.categories || {});
    if (!keys.length) {
      setCatalogCategoryKey("");
      return;
    }
    if (!catalogCategoryKey || !selectedIndustry?.categories?.[catalogCategoryKey]) {
      setCatalogCategoryKey(keys[0]);
    }
  }, [selectedIndustry, catalogCategoryKey]);

  useEffect(() => {
    const keys = Object.keys(selectedCategory?.subCategories || {});
    if (!keys.length) {
      setCatalogSubKey("");
      return;
    }
    if (!catalogSubKey || !selectedCategory?.subCategories?.[catalogSubKey]) {
      setCatalogSubKey(keys[0]);
    }
  }, [selectedCategory, catalogSubKey]);

  useEffect(() => {
    setCatalogItemForm(emptyCatalogItem);
    setEditingCatalogItemId("");
    setCatalogSearch("");
  }, [catalogIndustryKey, catalogCategoryKey, catalogSubKey]);

  useEffect(() => {
    setVisitorPage(1);
  }, [visitorSearch]);

  const upsertContent = async (key, title, data) => {
    const existing = contentByKey[key];
    if (existing?._id) {
      await api.updateContent(existing._id, { key, title, data });
    } else {
      await api.createContent({ key, title, data });
    }
    await loadAll();
  };

  const logout = () => {
    tokenStore.clear();
    window.location.href = "/login";
  };

  const saveUser = async (event) => {
    event.preventDefault();
    try {
      if (userForm.id) {
        await api.updateUser(userForm.id, { name: userForm.name, email: userForm.email });
        setMessage("User updated");
      } else {
        await api.createUser({ name: userForm.name, email: userForm.email });
        setMessage("User created");
      }
      setUserForm({ id: "", name: "", email: "" });
      await loadAll();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    try {
      const form = new FormData();
      form.append("name", productForm.name);
      form.append("description", productForm.description);
      form.append("price", productForm.price);
      if (productForm.image) form.append("image", productForm.image);

      if (productForm.id) {
        await api.updateProduct(productForm.id, form);
        setMessage("Product updated");
      } else {
        await api.createProduct(form);
        setMessage("Product created");
      }
      setProductForm({ id: "", name: "", description: "", price: "", image: null });
      await loadAll();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const addOrUpdateMarketSegment = (event) => {
    event.preventDefault();
    const payload = { ...marketForm };
    const index = marketSegments.findIndex((item) => item.id === payload.id);
    if (index >= 0) {
      const copy = [...marketSegments];
      copy[index] = payload;
      setMarketSegments(copy);
      setMessage("Market segment updated locally. Click Save Market Segments.");
    } else {
      setMarketSegments((prev) => [...prev, payload]);
      setMessage("Market segment added locally. Click Save Market Segments.");
    }
    setMarketForm(emptyMarket);
  };

  const addOrUpdateOurSegment = (event) => {
    event.preventDefault();
    const payload = {
      ...ourSegmentForm,
      features: ourSegmentForm.features
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };
    const index = ourSegments.findIndex((item) => item.id === payload.id);
    if (index >= 0) {
      const copy = [...ourSegments];
      copy[index] = payload;
      setOurSegments(copy);
    } else {
      setOurSegments((prev) => [...prev, payload]);
    }
    setOurSegmentForm(emptyOurSegment);
    setMessage("Our segment changed locally. Click Save Our Segments.");
  };

  const getNextSlideId = () => {
    const numericIds = homeSlides
      .map((item) => Number(item.id))
      .filter((value) => Number.isFinite(value));
    const maxId = numericIds.length ? Math.max(...numericIds) : 0;
    return String(maxId + 1);
  };

  const addOrUpdateSlide = (event) => {
    event.preventDefault();
    const trimmedId = String(slideForm.id || "").trim();
    const resolvedId = trimmedId ? (Number(trimmedId) || trimmedId) : getNextSlideId();
    const payload = { ...slideForm, id: resolvedId };
    const index = homeSlides.findIndex((item) => String(item.id) === String(payload.id));
    if (index >= 0) {
      const copy = [...homeSlides];
      copy[index] = payload;
      setHomeSlides(copy);
      setMessage("Slide updated locally. Click Save Home Page.");
    } else {
      setHomeSlides((prev) => [...prev, payload]);
      setMessage("Slide added locally. Click Save Home Page.");
    }
    setSlideForm(emptySlide);
  };

  const saveCatalogJson = async () => {
    try {
      const parsed = JSON.parse(catalogText);
      await upsertContent("productCatalog", "Product Catalog", parsed);
      setMessage("Product catalog saved");
    } catch (error) {
      setMessage("Invalid Product Catalog JSON");
    }
  };

  const saveCatalogItem = (event) => {
    event.preventDefault();
    if (!catalogIndustryKey || !catalogCategoryKey || !catalogSubKey) {
      setMessage("Select industry, category, and subcategory first.");
      return;
    }

    const itemPayload = {
      id: catalogItemForm.id.trim(),
      name: catalogItemForm.name.trim(),
      actualName: catalogItemForm.actualName.trim(),
      subCategory: catalogItemForm.subCategory.trim() || selectedSub?.title || "",
      image: catalogItemForm.image.trim(),
      description: catalogItemForm.description.trim(),
      features: catalogItemForm.features
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };

    if (!itemPayload.id || !itemPayload.name) {
      setMessage("Item id and name are required.");
      return;
    }

    updateCatalogObject((next) => {
      const items =
        next[catalogIndustryKey].categories[catalogCategoryKey].subCategories[catalogSubKey].items;
      const index = items.findIndex((x) => x.id === itemPayload.id);
      if (index >= 0) items[index] = itemPayload;
      else items.push(itemPayload);
    });

    setCatalogItemForm(emptyCatalogItem);
    setEditingCatalogItemId("");
    setMessage("Catalog item updated locally. Click Save Product Catalog.");
  };

  const editCatalogItem = (item) => {
    setEditingCatalogItemId(item.id);
    setCatalogItemForm({
      id: item.id || "",
      name: item.name || "",
      actualName: item.actualName || "",
      subCategory: item.subCategory || "",
      image: item.image || "",
      description: item.description || "",
      features: (item.features || []).join(", "),
    });
  };

  const deleteCatalogItem = (itemId) => {
    updateCatalogObject((next) => {
      const items =
        next[catalogIndustryKey].categories[catalogCategoryKey].subCategories[catalogSubKey].items;
      next[catalogIndustryKey].categories[catalogCategoryKey].subCategories[catalogSubKey].items =
        items.filter((x) => x.id !== itemId);
    });
    setMessage("Catalog item deleted locally. Click Save Product Catalog.");
  };

  const createIndustry = () => {
    const key = toKey(newIndustryKey) || toKey(newIndustryTitle);
    const title = newIndustryTitle.trim();
    if (!key || !title) {
      setMessage("Industry title is required. Key can be auto-generated.");
      return;
    }

    if (catalogObject[key]) {
      setMessage("Industry key already exists. Use another key/title.");
      return;
    }

    updateCatalogObject((next) => {
      next[key] = {
        id: key,
        title,
        description: "",
        categories: {},
      };
    });

    setCatalogIndustryKey(key);
    setNewIndustryKey("");
    setNewIndustryTitle("");
    setMessage("Industry created locally. Click Save Product Catalog.");
  };

  const createCategory = () => {
    const key = toKey(newCategoryKey) || toKey(newCategoryTitle);
    const title = newCategoryTitle.trim();
    if (!catalogIndustryKey) {
      setMessage("Select industry first.");
      return;
    }
    if (!key || !title) {
      setMessage("Category title is required. Key can be auto-generated.");
      return;
    }
    if (selectedIndustry?.categories?.[key]) {
      setMessage("Category key already exists in selected industry.");
      return;
    }

    updateCatalogObject((next) => {
      const industry = next[catalogIndustryKey];
      industry.categories = industry.categories || {};
      industry.categories[key] = { title, subCategories: {} };
    });

    setCatalogCategoryKey(key);
    setNewCategoryKey("");
    setNewCategoryTitle("");
    setMessage("Category created locally. Click Save Product Catalog.");
  };

  const createSubCategory = () => {
    const key = toKey(newSubKey) || toKey(newSubTitle);
    const title = newSubTitle.trim();
    if (!catalogIndustryKey || !catalogCategoryKey) {
      setMessage("Select industry and category first.");
      return;
    }
    if (!key || !title) {
      setMessage("Subcategory title is required. Key can be auto-generated.");
      return;
    }
    if (selectedCategory?.subCategories?.[key]) {
      setMessage("Subcategory key already exists in selected category.");
      return;
    }

    updateCatalogObject((next) => {
      const category = next[catalogIndustryKey].categories[catalogCategoryKey];
      category.subCategories = category.subCategories || {};
      category.subCategories[key] = { title, items: [] };
    });

    setCatalogSubKey(key);
    setNewSubKey("");
    setNewSubTitle("");
    setCatalogItemForm((s) => ({ ...s, subCategory: title }));
    setMessage("Subcategory created locally. Click Save Product Catalog.");
  };

  const deleteSelectedIndustry = () => {
    if (!catalogIndustryKey) return;
    const ok = window.confirm(
      `Delete industry "${selectedIndustry?.title || catalogIndustryKey}" with all categories and items?`
    );
    if (!ok) return;

    const currentKeys = [...industryKeys];
    const idx = currentKeys.indexOf(catalogIndustryKey);
    updateCatalogObject((next) => {
      delete next[catalogIndustryKey];
    });

    const fallback = currentKeys[idx + 1] || currentKeys[idx - 1] || "";
    setCatalogIndustryKey(fallback);
    setCatalogCategoryKey("");
    setCatalogSubKey("");
    setMessage("Industry deleted locally. Click Save Product Catalog.");
  };

  const deleteSelectedCategory = () => {
    if (!catalogIndustryKey || !catalogCategoryKey) return;
    const ok = window.confirm(
      `Delete category "${selectedCategory?.title || catalogCategoryKey}" with all subcategories and items?`
    );
    if (!ok) return;

    const currentKeys = categoryEntries.map(([key]) => key);
    const idx = currentKeys.indexOf(catalogCategoryKey);
    updateCatalogObject((next) => {
      delete next[catalogIndustryKey].categories[catalogCategoryKey];
    });

    const fallback = currentKeys[idx + 1] || currentKeys[idx - 1] || "";
    setCatalogCategoryKey(fallback);
    setCatalogSubKey("");
    setMessage("Category deleted locally. Click Save Product Catalog.");
  };

  const deleteSelectedSubCategory = () => {
    if (!catalogIndustryKey || !catalogCategoryKey || !catalogSubKey) return;
    const ok = window.confirm(
      `Delete subcategory "${selectedSub?.title || catalogSubKey}" with all items?`
    );
    if (!ok) return;

    const currentKeys = subEntries.map(([key]) => key);
    const idx = currentKeys.indexOf(catalogSubKey);
    updateCatalogObject((next) => {
      delete next[catalogIndustryKey].categories[catalogCategoryKey].subCategories[catalogSubKey];
    });

    const fallback = currentKeys[idx + 1] || currentKeys[idx - 1] || "";
    setCatalogSubKey(fallback);
    setMessage("Subcategory deleted locally. Click Save Product Catalog.");
  };

  const applySelectedSectionToItem = () => {
    setCatalogItemForm((s) => ({
      ...s,
      subCategory: selectedSub?.title || s.subCategory,
    }));
    setMessage("Item form linked to selected section.");
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("image", file);
    try {
      const uploaded = await api.uploadMedia(form);
      setMessage(`Uploaded: ${uploaded.url}`);
      await loadAll();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const uploadFileToField = async (file, setForm, field = "image") => {
    if (!file) return;
    const form = new FormData();
    form.append("image", file);
    try {
      const uploaded = await api.uploadMedia(form);
      setForm((previous) => ({ ...previous, [field]: uploaded.url }));
      setMessage(`Image uploaded: ${uploaded.url}`);
    } catch (error) {
      setMessage(error.message || "Upload failed");
    }
  };

  const removeAdmin = async (adminRecord) => {
    if (!adminRecord?._id) return;
    const email = String(adminRecord.email || "");
    if (!window.confirm(`Remove admin account ${email}?`)) return;
    try {
      await api.deleteAdmin(adminRecord._id);
      setMessage("Admin removed");
      await loadAll();
    } catch (error) {
      setMessage(error.message || "Failed to remove admin");
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h2>Admin</h2>
        <button className={active === "homeSlides" ? "active" : ""} onClick={() => setActive("homeSlides")}>Home</button>
        <button className={active === "admins" ? "active" : ""} onClick={() => setActive("admins")}>Admins</button>
        <button className={active === "leads" ? "active" : ""} onClick={() => setActive("leads")}>Leads</button>
        <button className={active === "about" ? "active" : ""} onClick={() => setActive("about")}>About</button>
        <button className={active === "products" ? "active" : ""} onClick={() => setActive("products")}>Products</button>
        <button className={active === "ourSegments" ? "active" : ""} onClick={() => setActive("ourSegments")}>Our Segments</button>
        <button className={active === "contact" ? "active" : ""} onClick={() => setActive("contact")}>Contact</button>
        <button className={active === "email" ? "active" : ""} onClick={() => setActive("email")}>Email</button>
        <button className={active === "analytics" ? "active" : ""} onClick={() => setActive("analytics")}>Analytics</button>
        <button className={active === "site" ? "active" : ""} onClick={() => setActive("site")}>Site</button>
        <button className={active === "media" ? "active" : ""} onClick={() => setActive("media")}>Media</button>
        <button className="logout" onClick={logout}>Logout</button>
      </aside>

      <main className="dashboard-main">
        <header>
          <h1>{sectionTitleMap[active] || "Content Admin"}</h1>
          {message ? <span className="status">{message}</span> : null}
        </header>

        {active === "products" ? (
          <div className="panel-form catalog-panel">
            <div className="catalog-actions-row">
              <button
                type="button"
                className={productsView === "segments" ? "active" : ""}
                onClick={() => setProductsView("segments")}
              >
                Market Segments
              </button>
              <button
                type="button"
                className={productsView === "catalog" ? "active" : ""}
                onClick={() => setProductsView("catalog")}
              >
                Product Catalog
              </button>
              <button
                type="button"
                className={productsView === "page" ? "active" : ""}
                onClick={() => setProductsView("page")}
              >
                Products Page Text
              </button>
            </div>

            {productsView === "catalog" ? (
              <>
              <div className="catalog-shell">
                <div className="catalog-header-row">
                  <h3>Product Catalog Editor</h3>
                  <button type="button" onClick={saveCatalogJson}>Save Product Catalog</button>
                </div>

                <div className="catalog-path">{catalogTargetPath} ({selectedSubItems.length} items)</div>
                <div className="catalog-target">
                  Editing target: {catalogTargetPath}
                </div>

                <section className="catalog-card">
                  <div className="catalog-step-title">Step 1: Select Exact Destination Section</div>
                  <div className="catalog-grid-3">
                    <div>
                      <label className="field-label">Industry</label>
                      <select value={catalogIndustryKey} onChange={(e) => setCatalogIndustryKey(e.target.value)}>
                        {industryKeys.map((key) => (
                          <option key={key} value={key}>
                            {catalogObject?.[key]?.title || key}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Category</label>
                      <select value={catalogCategoryKey} onChange={(e) => setCatalogCategoryKey(e.target.value)}>
                        {categoryEntries.map(([key, value]) => (
                          <option key={key} value={key}>
                            {value?.title || key}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Subcategory</label>
                      <select value={catalogSubKey} onChange={(e) => setCatalogSubKey(e.target.value)}>
                        {subEntries.map(([key, value]) => (
                          <option key={key} value={key}>
                            {value?.title || key}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="catalog-actions-row">
                    <button type="button" className="danger" onClick={deleteSelectedIndustry} disabled={!catalogIndustryKey}>
                      Delete Industry
                    </button>
                    <button type="button" className="danger" onClick={deleteSelectedCategory} disabled={!catalogCategoryKey}>
                      Delete Category
                    </button>
                    <button type="button" className="danger" onClick={deleteSelectedSubCategory} disabled={!catalogSubKey}>
                      Delete Subcategory
                    </button>
                  </div>
                </section>

                <details className="catalog-details">
                  <summary>Add New Industry / Category / Subcategory</summary>
                  <div className="catalog-grid-3 catalog-create-row">
                    <input
                      placeholder="New industry key (example: healthcare)"
                      value={newIndustryKey}
                      onChange={(e) => setNewIndustryKey(e.target.value)}
                    />
                    <input
                      placeholder="New industry title"
                      value={newIndustryTitle}
                      onChange={(e) => setNewIndustryTitle(e.target.value)}
                    />
                    <button type="button" onClick={createIndustry}>Add Industry</button>
                  </div>

                  <div className="catalog-grid-3 catalog-create-row">
                    <input
                      placeholder="New category key (example: bottles)"
                      value={newCategoryKey}
                      onChange={(e) => setNewCategoryKey(e.target.value)}
                    />
                    <input
                      placeholder="New category title"
                      value={newCategoryTitle}
                      onChange={(e) => setNewCategoryTitle(e.target.value)}
                    />
                    <button type="button" onClick={createCategory}>Add Category</button>
                  </div>

                  <div className="catalog-grid-3 catalog-create-row">
                    <input
                      placeholder="New subcategory key (example: hdpe)"
                      value={newSubKey}
                      onChange={(e) => setNewSubKey(e.target.value)}
                    />
                    <input
                      placeholder="New subcategory title"
                      value={newSubTitle}
                      onChange={(e) => setNewSubTitle(e.target.value)}
                    />
                    <button type="button" onClick={createSubCategory}>Add Subcategory</button>
                  </div>
                </details>

                <section className="catalog-card">
                  <div className="catalog-step-title">Step 2: Add / Edit Item</div>
                  <div className="catalog-mode-row">
                    <span className={`catalog-mode-badge ${editingCatalogItemId ? "editing" : "adding"}`}>
                      {editingCatalogItemId ? `Editing: ${editingCatalogItemId}` : "Adding New Item"}
                    </span>
                    <span className="catalog-mode-target">Target: {catalogTargetPath}</span>
                  </div>
                  <div className={`catalog-target-box ${isCatalogTargetReady ? "ready" : "missing"}`}>
                    {isCatalogTargetReady
                      ? `Item will be saved in: ${catalogTargetPath}`
                      : "Select Industry + Category + Subcategory in Step 1 before adding item."}
                  </div>
                  <form className="panel-form catalog-item-form" onSubmit={saveCatalogItem}>
                    <div className="catalog-grid-2">
                      <div>
                        <label className="field-label">Item ID *</label>
                        <input placeholder="example: hdpe-120cc-38mm" value={catalogItemForm.id} onChange={(e) => setCatalogItemForm((s) => ({ ...s, id: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="field-label">Display Name *</label>
                        <input placeholder="example: 120cc HDPE Bottle" value={catalogItemForm.name} onChange={(e) => setCatalogItemForm((s) => ({ ...s, name: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="catalog-grid-2">
                      <div>
                        <label className="field-label">Actual Name</label>
                        <input placeholder="manufacturer or long name" value={catalogItemForm.actualName} onChange={(e) => setCatalogItemForm((s) => ({ ...s, actualName: e.target.value }))} />
                      </div>
                      <div className="catalog-sub-row">
                        <div>
                          <label className="field-label">Subcategory Label</label>
                          <input placeholder="example: HDPE Bottles" value={catalogItemForm.subCategory} onChange={(e) => setCatalogItemForm((s) => ({ ...s, subCategory: e.target.value }))} />
                        </div>
                        <button type="button" onClick={applySelectedSectionToItem}>Use Selected</button>
                      </div>
                    </div>
                    <div>
                      <label className="field-label">Product Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => uploadFileToField(e.target.files?.[0], setCatalogItemForm)}
                      />
                    </div>
                    {catalogItemForm.image ? <small>Image: {catalogItemForm.image}</small> : null}
                    <div>
                      <label className="field-label">Description</label>
                      <textarea rows="3" placeholder="short product description" value={catalogItemForm.description} onChange={(e) => setCatalogItemForm((s) => ({ ...s, description: e.target.value }))} />
                    </div>
                    <div>
                      <label className="field-label">Features (comma separated)</label>
                      <input placeholder="example: Leak-proof, Food-grade, Durable" value={catalogItemForm.features} onChange={(e) => setCatalogItemForm((s) => ({ ...s, features: e.target.value }))} />
                    </div>
                    <div className="catalog-actions-row">
                      <button type="submit" disabled={!isCatalogTargetReady}>
                        {editingCatalogItemId
                          ? `Update Item in ${selectedSub?.title || "Selected Subcategory"}`
                          : `Create Item in ${selectedSub?.title || "Selected Subcategory"}`}
                      </button>
                      {editingCatalogItemId ? (
                        <button type="button" className="secondary" onClick={() => { setCatalogItemForm(emptyCatalogItem); setEditingCatalogItemId(""); }}>
                          Cancel Edit
                        </button>
                      ) : null}
                    </div>
                  </form>
                </section>

                <section className="catalog-card">
                  <div className="catalog-step-title">Step 3: Search & Manage Items</div>
                  <input
                    placeholder="Search selected section products..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Description</th>
                          <th>Image</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSubItemsFiltered.map((item) => (
                          <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.name}</td>
                            <td>{item.description || "-"}</td>
                            <td>{item.image ? <img src={resolveImageUrl(item.image)} alt={item.name} /> : "-"}</td>
                            <td>
                              <button type="button" onClick={() => editCatalogItem(item)}>Edit</button>
                              <button type="button" className="danger" onClick={() => deleteCatalogItem(item.id)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                        {selectedSubItemsFiltered.length === 0 ? (
                          <tr>
                            <td colSpan="5">No products found for this section/search.</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="catalog-card">
                  <div className="catalog-summary-row">
                    <div><strong>Total Catalog Products:</strong> {catalogItems.length}</div>
                    <button type="button" onClick={() => setShowCatalogSummaryTable((s) => !s)}>
                      {showCatalogSummaryTable ? "Hide Full List" : "Show Full List"}
                    </button>
                  </div>
                  {showCatalogSummaryTable ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Image</th>
                            <th>Industry</th>
                            <th>Category</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catalogItems.slice(0, 120).map((item) => (
                            <tr key={item.id}>
                              <td>{item.id}</td>
                              <td>{item.name}</td>
                              <td>{item.description || "-"}</td>
                              <td>{item.image ? <img src={resolveImageUrl(item.image)} alt={item.name} /> : "-"}</td>
                              <td>{item.industry}</td>
                              <td>{item.category}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </section>
              </div>
              </>
            ) : null}

            {productsView === "segments" ? (
              <>
                <h3>Market Segments Editor</h3>
                <form className="panel-form" onSubmit={addOrUpdateMarketSegment}>
                  <input placeholder="id" value={marketForm.id} onChange={(e) => setMarketForm((s) => ({ ...s, id: e.target.value }))} required />
                  <input placeholder="name" value={marketForm.name} onChange={(e) => setMarketForm((s) => ({ ...s, name: e.target.value }))} required />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadFileToField(e.target.files?.[0], setMarketForm)}
                  />
                  {marketForm.image ? <small>Image: {marketForm.image}</small> : null}
                  <input placeholder="tag" value={marketForm.tag} onChange={(e) => setMarketForm((s) => ({ ...s, tag: e.target.value }))} />
                  <textarea rows="3" placeholder="description" value={marketForm.description} onChange={(e) => setMarketForm((s) => ({ ...s, description: e.target.value }))} required />
                  <button type="submit">Add / Update Segment</button>
                  <button type="button" onClick={() => upsertContent("marketSegments", "Market Segments", marketSegments).then(() => setMessage("Market segments saved"))}>Save Market Segments</button>
                </form>
                <table><thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Image Path</th><th>Preview</th><th>Actions</th></tr></thead><tbody>
                  {marketSegments.map((item) => (
                    <tr key={item.id}><td>{item.id}</td><td>{item.name}</td><td>{item.description || "-"}</td><td>{item.image}</td><td>{item.image ? <img src={resolveImageUrl(item.image)} alt={item.name} /> : "-"}</td>
                      <td>
                        <button onClick={() => setMarketForm(item)}>Edit</button>
                        <button className="danger" onClick={() => setMarketSegments((prev) => prev.filter((x) => x.id !== item.id))}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody></table>
              </>
            ) : null}

            {productsView === "page" ? (
              <>
                <h3>Products Page Content</h3>
                <div className="panel-form">
                  <input
                    placeholder="Header title"
                    value={productsPageContent.headerTitle || ""}
                    onChange={(e) => setProductsPageContent((s) => ({ ...s, headerTitle: e.target.value }))}
                  />
                  <textarea
                    rows="3"
                    placeholder="Header description"
                    value={productsPageContent.headerDescription || ""}
                    onChange={(e) => setProductsPageContent((s) => ({ ...s, headerDescription: e.target.value }))}
                  />
                  <input
                    placeholder="CTA title"
                    value={productsPageContent.ctaTitle || ""}
                    onChange={(e) => setProductsPageContent((s) => ({ ...s, ctaTitle: e.target.value }))}
                  />
                  <textarea
                    rows="3"
                    placeholder="CTA description"
                    value={productsPageContent.ctaDescription || ""}
                    onChange={(e) => setProductsPageContent((s) => ({ ...s, ctaDescription: e.target.value }))}
                  />
                  <input
                    placeholder="CTA button text"
                    value={productsPageContent.ctaButtonText || ""}
                    onChange={(e) => setProductsPageContent((s) => ({ ...s, ctaButtonText: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      upsertContent("productsPage", "Products Page", productsPageContent).then(() =>
                        setMessage("Products page content saved")
                      )
                    }
                  >
                    Save Products Page Content
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {active === "leads" ? (
          <>
            <div className="panel-form">
              <h3>Leads (Contact Form)</h3>
              <small>Total leads: {leads.length}</small>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Received</th>
                    <th>Status</th>
                    <th>Sent To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead._id}>
                      <td>{lead.fullName || "-"}</td>
                      <td>{lead.email || "-"}</td>
                      <td>{lead.subject || "-"}</td>
                      <td>{lead.message ? String(lead.message).slice(0, 120) : "-"}</td>
                      <td>{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "-"}</td>
                      <td>{lead.mailStatus || "-"}</td>
                      <td>{lead.sentTo || "-"}</td>
                      <td>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => {
                            if (!window.confirm("Delete this lead?")) return;
                            api.deleteLead(lead._id)
                              .then(() => {
                                setLeads((prev) => prev.filter((item) => item._id !== lead._id));
                                setMessage("Lead deleted");
                              })
                              .catch((error) => setMessage(error.message || "Failed to delete lead"));
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan="8">No leads found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {active === "admins" ? (
          <>
            <div className="panel-form">
              <h3>Admin Accounts</h3>
              <small>Total admins: {admins.length}</small>
            </div>
            <form
              className="panel-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!adminForm.email || !adminForm.password) {
                  setMessage("Admin email and password are required");
                  return;
                }
                api.createAdmin(adminForm)
                  .then((res) => {
                    const created = res.admin || null;
                    if (created) {
                      setAdmins((prev) => [created, ...prev]);
                    } else {
                      api.getAdmins().then((payload) => {
                        setAdmins(Array.isArray(payload.admins) ? payload.admins : []);
                      });
                    }
                    setAdminForm({ name: "", email: "", password: "" });
                    setMessage("Admin created");
                  })
                  .catch((error) => setMessage(error.message || "Failed to create admin"));
              }}
            >
              <h4>Add New Admin</h4>
              <input
                placeholder="Name"
                value={adminForm.name}
                onChange={(e) => setAdminForm((s) => ({ ...s, name: e.target.value }))}
              />
              <input
                placeholder="Email"
                type="email"
                value={adminForm.email}
                onChange={(e) => setAdminForm((s) => ({ ...s, email: e.target.value }))}
                required
              />
              <input
                placeholder="Password"
                type="password"
                value={adminForm.password}
                onChange={(e) => setAdminForm((s) => ({ ...s, password: e.target.value }))}
                required
              />
              <button type="submit">Create Admin</button>
            </form>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin._id}>
                      <td>{admin.name || "-"}</td>
                      <td>{admin.email || "-"}</td>
                      <td>{admin.createdAt ? new Date(admin.createdAt).toLocaleString() : "-"}</td>
                      <td>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => removeAdmin(admin)}
                          disabled={
                            admins.length <= 1 ||
                            String(admin.email || "").toLowerCase() === currentAdminEmail
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan="4">No admin accounts found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {active === "ourSegments" ? (
          <>
            <div className="panel-form">
              <h3>Our Segments Page Header</h3>
              <input
                placeholder="Header title"
                value={ourSegmentsPageContent.headerTitle || ""}
                onChange={(e) => setOurSegmentsPageContent((s) => ({ ...s, headerTitle: e.target.value }))}
              />
              <textarea
                rows="3"
                placeholder="Header description"
                value={ourSegmentsPageContent.headerDescription || ""}
                onChange={(e) => setOurSegmentsPageContent((s) => ({ ...s, headerDescription: e.target.value }))}
              />
              <button
                type="button"
                onClick={() =>
                  upsertContent("ourSegmentsPage", "Our Segments Page", ourSegmentsPageContent).then(() =>
                    setMessage("Our segments page header saved")
                  )
                }
              >
                Save Our Segments Header
              </button>
            </div>
            <form className="panel-form" onSubmit={addOrUpdateOurSegment}>
              <input placeholder="id" value={ourSegmentForm.id} onChange={(e) => setOurSegmentForm((s) => ({ ...s, id: e.target.value }))} required />
              <input placeholder="title" value={ourSegmentForm.title} onChange={(e) => setOurSegmentForm((s) => ({ ...s, title: e.target.value }))} required />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => uploadFileToField(e.target.files?.[0], setOurSegmentForm)}
              />
              {ourSegmentForm.image ? <small>Image: {ourSegmentForm.image}</small> : null}
              <textarea rows="3" placeholder="description" value={ourSegmentForm.description} onChange={(e) => setOurSegmentForm((s) => ({ ...s, description: e.target.value }))} required />
              <input placeholder="features comma separated" value={ourSegmentForm.features} onChange={(e) => setOurSegmentForm((s) => ({ ...s, features: e.target.value }))} />
              <button type="submit">Add / Update Our Segment</button>
              <button type="button" onClick={() => upsertContent("ourSegments", "Our Segments", ourSegments).then(() => setMessage("Our segments saved"))}>Save Our Segments</button>
            </form>
            <table><thead><tr><th>ID</th><th>Title</th><th>Description</th><th>Image Path</th><th>Preview</th><th>Actions</th></tr></thead><tbody>
              {ourSegments.map((item) => (
                <tr key={item.id}><td>{item.id}</td><td>{item.title}</td><td>{item.description || "-"}</td><td>{item.image}</td><td>{item.image ? <img src={resolveImageUrl(item.image)} alt={item.title} /> : "-"}</td>
                  <td>
                    <button onClick={() => setOurSegmentForm({ ...item, features: (item.features || []).join(", ") })}>Edit</button>
                    <button className="danger" onClick={() => setOurSegments((prev) => prev.filter((x) => x.id !== item.id))}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody></table>
          </>
        ) : null}

        {active === "homeSlides" ? (
          <div className="catalog-shell">
            <section className="catalog-card">
              <form className="panel-form" onSubmit={addOrUpdateSlide}>
                <h3>Hero Slides (Title + Subtitle + Description)</h3>
                <input placeholder="Slide id (leave blank for auto)" value={slideForm.id} onChange={(e) => setSlideForm((s) => ({ ...s, id: e.target.value }))} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadFileToField(e.target.files?.[0], setSlideForm)}
                />
                {slideForm.image ? <small>Image: {slideForm.image}</small> : null}
                <input placeholder="Hero Title (line 1)" value={slideForm.title} onChange={(e) => setSlideForm((s) => ({ ...s, title: e.target.value }))} required />
                <input placeholder="Hero Subtitle (line 2)" value={slideForm.subtitle} onChange={(e) => setSlideForm((s) => ({ ...s, subtitle: e.target.value }))} required />
                <textarea rows="3" placeholder="Hero Description (line 3)" value={slideForm.text} onChange={(e) => setSlideForm((s) => ({ ...s, text: e.target.value }))} required />
                <div className="catalog-actions-row">
                  <button type="submit">Add / Update Slide</button>
                  <button type="button" onClick={() => upsertContent("homePage", "Home Page", { ...homeExtra, slides: homeSlides }).then(() => setMessage("Home page saved"))}>Save Home Page</button>
                </div>
              </form>
              <div className="table-wrap">
                <table><thead><tr><th>ID</th><th>Title</th><th>Subtitle</th><th>Description</th><th>Image Path</th><th>Preview</th><th>Actions</th></tr></thead><tbody>
                  {homeSlides.map((slide) => (
                    <tr key={slide.id}><td>{slide.id}</td><td>{slide.title}</td><td>{slide.subtitle || "-"}</td><td>{slide.text || "-"}</td><td>{slide.image}</td><td>{slide.image ? <img src={resolveImageUrl(slide.image)} alt={slide.title} /> : "-"}</td>
                      <td>
                        <button onClick={() => setSlideForm({ ...slide, id: String(slide.id) })}>Edit</button>
                        <button className="danger" onClick={() => setHomeSlides((prev) => prev.filter((x) => String(x.id) !== String(slide.id)))}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            </section>

            <section className="catalog-card">
              <div className="panel-form">
                <h3>Home Features</h3>
                {[0, 1, 2].map((index) => (
                  <div className="catalog-grid-2" key={`feature-${index}`}>
                    <input
                      placeholder={`Feature ${index + 1} title`}
                      value={homeExtra.features?.[index]?.title || ""}
                      onChange={(e) =>
                        setHomeExtra((s) => {
                          const features = [...(s.features || [])];
                          features[index] = { ...(features[index] || {}), id: features[index]?.id || `feature_${index + 1}`, title: e.target.value };
                          return { ...s, features };
                        })
                      }
                    />
                    <input
                      placeholder={`Feature ${index + 1} text`}
                      value={homeExtra.features?.[index]?.text || ""}
                      onChange={(e) =>
                        setHomeExtra((s) => {
                          const features = [...(s.features || [])];
                          features[index] = { ...(features[index] || {}), id: features[index]?.id || `feature_${index + 1}`, text: e.target.value };
                          return { ...s, features };
                        })
                      }
                    />
                  </div>
                ))}
                <h3>About Preview Block</h3>
                <input
                  placeholder="About preview title"
                  value={homeExtra.aboutPreview?.title || ""}
                  onChange={(e) =>
                    setHomeExtra((s) => ({
                      ...s,
                      aboutPreview: { ...(s.aboutPreview || {}), title: e.target.value },
                    }))
                  }
                />
                <textarea
                  rows="3"
                  placeholder="About preview description"
                  value={homeExtra.aboutPreview?.description || ""}
                  onChange={(e) =>
                    setHomeExtra((s) => ({
                      ...s,
                      aboutPreview: { ...(s.aboutPreview || {}), description: e.target.value },
                    }))
                  }
                />
                <input
                  placeholder="About preview button text"
                  value={homeExtra.aboutPreview?.buttonText || ""}
                  onChange={(e) =>
                    setHomeExtra((s) => ({
                      ...s,
                      aboutPreview: { ...(s.aboutPreview || {}), buttonText: e.target.value },
                    }))
                  }
                />
                <div className="catalog-grid-2">
                  <input
                    placeholder="Stat 1 value (example: 500K+)"
                    value={homeExtra.aboutPreview?.stats?.[0]?.value || ""}
                    onChange={(e) =>
                      setHomeExtra((s) => {
                        const stats = [...(s.aboutPreview?.stats || [])];
                        stats[0] = { ...(stats[0] || {}), value: e.target.value, label: stats[0]?.label || "Units/Month" };
                        return { ...s, aboutPreview: { ...(s.aboutPreview || {}), stats } };
                      })
                    }
                  />
                  <input
                    placeholder="Stat 1 label"
                    value={homeExtra.aboutPreview?.stats?.[0]?.label || ""}
                    onChange={(e) =>
                      setHomeExtra((s) => {
                        const stats = [...(s.aboutPreview?.stats || [])];
                        stats[0] = { ...(stats[0] || {}), label: e.target.value, value: stats[0]?.value || "0+" };
                        return { ...s, aboutPreview: { ...(s.aboutPreview || {}), stats } };
                      })
                    }
                  />
                  <input
                    placeholder="Stat 2 value (example: 120+)"
                    value={homeExtra.aboutPreview?.stats?.[1]?.value || ""}
                    onChange={(e) =>
                      setHomeExtra((s) => {
                        const stats = [...(s.aboutPreview?.stats || [])];
                        stats[1] = { ...(stats[1] || {}), value: e.target.value, label: stats[1]?.label || "Clients" };
                        return { ...s, aboutPreview: { ...(s.aboutPreview || {}), stats } };
                      })
                    }
                  />
                  <input
                    placeholder="Stat 2 label"
                    value={homeExtra.aboutPreview?.stats?.[1]?.label || ""}
                    onChange={(e) =>
                      setHomeExtra((s) => {
                        const stats = [...(s.aboutPreview?.stats || [])];
                        stats[1] = { ...(stats[1] || {}), label: e.target.value, value: stats[1]?.value || "0+" };
                        return { ...s, aboutPreview: { ...(s.aboutPreview || {}), stats } };
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => upsertContent("homePage", "Home Page", { ...homeExtra, slides: homeSlides }).then(() => setMessage("Home page saved"))}
                >
                  Save Home Page
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {active === "about" ? (
          <div className="panel-form">
            <h3>About Page Content</h3>
            <input placeholder="Page title" value={aboutContent.pageTitle || ""} onChange={(e) => setAboutContent((s) => ({ ...s, pageTitle: e.target.value }))} />
            <textarea rows="4" placeholder="Page description" value={aboutContent.pageDescription || ""} onChange={(e) => setAboutContent((s) => ({ ...s, pageDescription: e.target.value }))} />
            <input placeholder="Who We Are title" value={aboutContent.whoWeAreTitle || ""} onChange={(e) => setAboutContent((s) => ({ ...s, whoWeAreTitle: e.target.value }))} />
            <textarea rows="3" placeholder="Who We Are highlighted line" value={aboutContent.whoWeAreHighlight || ""} onChange={(e) => setAboutContent((s) => ({ ...s, whoWeAreHighlight: e.target.value }))} />
            <textarea rows="4" placeholder="Who We Are paragraph 1" value={aboutContent.whoWeAreParagraphOne || ""} onChange={(e) => setAboutContent((s) => ({ ...s, whoWeAreParagraphOne: e.target.value }))} />
            <textarea rows="4" placeholder="Who We Are paragraph 2" value={aboutContent.whoWeAreParagraphTwo || ""} onChange={(e) => setAboutContent((s) => ({ ...s, whoWeAreParagraphTwo: e.target.value }))} />
            <div className="catalog-grid-2">
              <input placeholder="Vision title" value={aboutContent.visionTitle || ""} onChange={(e) => setAboutContent((s) => ({ ...s, visionTitle: e.target.value }))} />
              <input placeholder="Mission title" value={aboutContent.missionTitle || ""} onChange={(e) => setAboutContent((s) => ({ ...s, missionTitle: e.target.value }))} />
            </div>
            <textarea rows="3" placeholder="Vision text" value={aboutContent.visionText || ""} onChange={(e) => setAboutContent((s) => ({ ...s, visionText: e.target.value }))} />
            <textarea rows="3" placeholder="Mission text" value={aboutContent.missionText || ""} onChange={(e) => setAboutContent((s) => ({ ...s, missionText: e.target.value }))} />
            <button onClick={() => upsertContent("aboutPage", "About Page", aboutContent).then(() => setMessage("About page saved"))}>Save About Page</button>
          </div>
        ) : null}

        {active === "contact" ? (
          <div className="panel-form">
            <h3>Contact Section Editor</h3>
            <input placeholder="Page title" value={contactContent.pageTitle || ""} onChange={(e) => setContactContent((s) => ({ ...s, pageTitle: e.target.value }))} />
            <textarea rows="4" placeholder="Page description" value={contactContent.pageDescription || ""} onChange={(e) => setContactContent((s) => ({ ...s, pageDescription: e.target.value }))} />
            <input placeholder="Info heading" value={contactContent.infoHeading || ""} onChange={(e) => setContactContent((s) => ({ ...s, infoHeading: e.target.value }))} />
            <textarea rows="3" placeholder="Info subheading" value={contactContent.infoSubheading || ""} onChange={(e) => setContactContent((s) => ({ ...s, infoSubheading: e.target.value }))} />
            <div className="catalog-grid-2">
              <input placeholder="Map title" value={contactContent.mapTitle || ""} onChange={(e) => setContactContent((s) => ({ ...s, mapTitle: e.target.value }))} />
              <input placeholder="Phone title" value={contactContent.phoneTitle || ""} onChange={(e) => setContactContent((s) => ({ ...s, phoneTitle: e.target.value }))} />
            </div>
            <input placeholder="Email title" value={contactContent.emailTitle || ""} onChange={(e) => setContactContent((s) => ({ ...s, emailTitle: e.target.value }))} />
            <div className="catalog-grid-2">
              <input placeholder="Phone number" value={contactContent.contactInfo?.phone || ""} onChange={(e) => setContactContent((s) => ({ ...s, contactInfo: { ...(s.contactInfo || {}), phone: e.target.value } }))} />
              <input placeholder="WhatsApp number (digits only)" value={contactContent.contactInfo?.whatsapp || ""} onChange={(e) => setContactContent((s) => ({ ...s, contactInfo: { ...(s.contactInfo || {}), whatsapp: e.target.value } }))} />
            </div>
            <input placeholder="Contact email" value={contactContent.contactInfo?.email || ""} onChange={(e) => setContactContent((s) => ({ ...s, contactInfo: { ...(s.contactInfo || {}), email: e.target.value } }))} />
            <textarea rows="3" placeholder="Address" value={contactContent.contactInfo?.address || ""} onChange={(e) => setContactContent((s) => ({ ...s, contactInfo: { ...(s.contactInfo || {}), address: e.target.value } }))} />
            <input placeholder="Map URL" value={contactContent.contactInfo?.mapLink || ""} onChange={(e) => setContactContent((s) => ({ ...s, contactInfo: { ...(s.contactInfo || {}), mapLink: e.target.value } }))} />
            <input placeholder="Subjects (comma separated)" value={Array.isArray(contactContent.subjects) ? contactContent.subjects.join(", ") : ""} onChange={(e) => setContactContent((s) => ({ ...s, subjects: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) }))} />
            <button onClick={() => upsertContent("contactPage", "Contact Page", contactContent).then(() => setMessage("Contact section saved"))}>Save Contact Section</button>
          </div>
        ) : null}

        {active === "email" ? (
          <div className="email-settings-panel">
            <div className="email-section">
              <div className="email-section-header">
                <h3>Recipients</h3>
                <p>These emails will receive contact form messages.</p>
              </div>
              <div className="email-recipient-list">
                <div className="email-recipient-count">
                  Recipients:{" "}
                  {String(emailSettings.contactRecipients || "")
                    .split(/[;,]/)
                    .map((x) => x.trim())
                    .filter(Boolean).length}
                </div>
                <div className="email-recipient-item">
                  <div className="email-field">
                    <label>Add new recipient</label>
                    <input
                      placeholder="name@example.com"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                    />
                    {emailErrors.recipientAdd ? (
                      <small className="field-error">{emailErrors.recipientAdd}</small>
                    ) : null}
                  </div>
                  <div className="email-recipient-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        const email = newRecipient.trim();
                        if (!email || !email.includes("@")) {
                          setEmailErrors((prev) => ({ ...prev, recipientAdd: "Enter a valid email." }));
                          return;
                        }
                        setEmailSettings((prev) => {
                          const current = String(prev.contactRecipients || "")
                            .split(/[;,]/)
                            .map((x) => x.trim())
                            .filter(Boolean);
                          const exists = current.some((item) => item.toLowerCase() === email.toLowerCase());
                          if (exists) {
                            setEmailErrors((prevErr) => ({ ...prevErr, recipientAdd: "Already added." }));
                            return prev;
                          }
                          return { ...prev, contactRecipients: [...current, email].join(", ") };
                        });
                        setEmailErrors((prev) => ({ ...prev, recipientAdd: "" }));
                        setNewRecipient("");
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {String(emailSettings.contactRecipients || "")
                  .split(/[;,]/)
                  .map((x) => x.trim())
                  .filter(Boolean)
                  .map((email, index) => (
                    <div key={`${email}-${index}`} className="email-recipient-item">
                      {editingRecipient === email ? (
                        <>
                          <div className="email-field">
                            <label>Edit recipient</label>
                            <input
                              value={editingRecipientValue}
                              onChange={(e) => setEditingRecipientValue(e.target.value)}
                            />
                          </div>
                          <div className="email-recipient-actions">
                            <button
                              type="button"
                              onClick={() => {
                                const nextValue = editingRecipientValue.trim();
                                if (!nextValue || !nextValue.includes("@")) {
                                  setEmailErrors((prev) => ({ ...prev, recipientEdit: "Enter a valid email." }));
                                  return;
                                }
                                const current = String(emailSettings.contactRecipients || "")
                                  .split(/[;,]/)
                                  .map((x) => x.trim())
                                  .filter(Boolean);
                                const updated = current.map((item, idx) => (idx === index ? nextValue : item));
                                setEmailSettings((s) => ({
                                  ...s,
                                  contactRecipients: updated.filter(Boolean).join(", "),
                                }));
                                setEditingRecipient("");
                                setEditingRecipientValue("");
                                setEmailErrors((prev) => ({ ...prev, recipientEdit: "" }));
                              }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="secondary small"
                              onClick={() => {
                                setEditingRecipient("");
                                setEditingRecipientValue("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="email-field">
                            <label>Recipient</label>
                            <input value={email} readOnly />
                          </div>
                          <div className="email-recipient-actions">
                            <button
                              type="button"
                              className="secondary small"
                              onClick={() => {
                                setEditingRecipient(email);
                                setEditingRecipientValue(email);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => {
                                const updated = String(emailSettings.contactRecipients || "")
                                  .split(/[;,]/)
                                  .map((x) => x.trim())
                                  .filter(Boolean)
                                  .filter((_, idx) => idx !== index);
                                setEmailSettings((s) => ({
                                  ...s,
                                  contactRecipients: updated.join(", "),
                                }));
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="email-section">
              <div className="email-section-header">
                <h3>SMTP Settings</h3>
                <p>Use your email provider credentials (Gmail requires an App Password).</p>
              </div>
              <div className="email-field">
                <label>From email (optional)</label>
                <input
                  placeholder="name@company.com"
                  value={emailSettings.contactFromEmail || ""}
                  onChange={(e) => setEmailSettings((s) => ({ ...s, contactFromEmail: e.target.value }))}
                />
              </div>
              <div className="email-field">
                <label>From name</label>
                <input
                  placeholder="Aethon Plast"
                  value={emailSettings.contactFromName || ""}
                  onChange={(e) => setEmailSettings((s) => ({ ...s, contactFromName: e.target.value }))}
                />
              </div>
              <div className="catalog-grid-2">
                <div className="email-field">
                  <label>SMTP host *</label>
                  <input
                    placeholder="smtp.gmail.com"
                    value={emailSettings.smtpHost || ""}
                    onChange={(e) => setEmailSettings((s) => ({ ...s, smtpHost: e.target.value }))}
                  />
                  {emailErrors.smtpHost ? <small className="field-error">{emailErrors.smtpHost}</small> : null}
                </div>
                <div className="email-field">
                  <label>SMTP port *</label>
                  <input
                    placeholder="587"
                    value={emailSettings.smtpPort || ""}
                    onChange={(e) => setEmailSettings((s) => ({ ...s, smtpPort: e.target.value }))}
                  />
                  {emailErrors.smtpPort ? <small className="field-error">{emailErrors.smtpPort}</small> : null}
                </div>
              </div>
              <div className="catalog-grid-2">
                <div className="email-field">
                  <label>SMTP secure *</label>
                  <input
                    placeholder="false"
                    value={emailSettings.smtpSecure || ""}
                    onChange={(e) => setEmailSettings((s) => ({ ...s, smtpSecure: e.target.value }))}
                  />
                </div>
                <div className="email-field">
                  <label>SMTP user *</label>
                  <input
                    placeholder="your@gmail.com"
                    value={emailSettings.smtpUser || ""}
                    onChange={(e) => setEmailSettings((s) => ({ ...s, smtpUser: e.target.value }))}
                  />
                  {emailErrors.smtpUser ? <small className="field-error">{emailErrors.smtpUser}</small> : null}
                </div>
              </div>
              <div className="catalog-grid-2">
                <div className="email-field">
                  <label>SMTP password *</label>
                  <input
                    type={showEmailPassword ? "text" : "password"}
                    placeholder="App password"
                    value={emailSettings.smtpPass || ""}
                    onChange={(e) => setEmailSettings((s) => ({ ...s, smtpPass: e.target.value }))}
                  />
                  {emailErrors.smtpPass ? <small className="field-error">{emailErrors.smtpPass}</small> : null}
                </div>
                <button
                  type="button"
                  className="secondary small"
                  onClick={() => setShowEmailPassword((s) => !s)}
                >
                  {showEmailPassword ? "Hide Password" : "Show Password"}
                </button>
              </div>
              <div className="email-actions">
                <button
                  onClick={() => {
                    const recipients = String(emailSettings.contactRecipients || "")
                      .split(/[;,]/)
                      .map((x) => x.trim())
                      .filter(Boolean);
                    const pending = newRecipient.trim();
                    const nextRecipients = pending ? [...recipients, pending] : recipients;
                    const uniqueRecipients = nextRecipients.filter(
                      (item, idx, arr) =>
                        item && arr.findIndex((x) => x.toLowerCase() === item.toLowerCase()) === idx
                    );
                    const hasAt = uniqueRecipients.every((x) => x.includes("@"));
                    const portNumber = Number(emailSettings.smtpPort);
                    const nextErrors = {};
                    if (!uniqueRecipients.length || !hasAt) {
                      nextErrors.recipientAdd = "Add at least one valid recipient email.";
                    }
                    if (!emailSettings.smtpHost) nextErrors.smtpHost = "SMTP host is required.";
                    if (!emailSettings.smtpUser) nextErrors.smtpUser = "SMTP user is required.";
                    if (!emailSettings.smtpPass) nextErrors.smtpPass = "SMTP password is required.";
                    if (!Number.isFinite(portNumber) || portNumber <= 0) {
                      nextErrors.smtpPort = "SMTP port must be a valid number.";
                    }
                    setEmailErrors(nextErrors);
                    if (Object.keys(nextErrors).length) return;
                    const payload = { ...emailSettings, contactRecipients: uniqueRecipients.join(", ") };
                    upsertContent("emailSettings", "Email Settings", payload)
                      .then(() => {
                        setEmailSettings((prev) => ({
                          ...prev,
                          ...payload,
                          contactRecipients: payload.contactRecipients,
                        }));
                        setNewRecipient("");
                        setEmailErrors({});
                        setMessage("Email settings saved");
                      });
                  }}
                >
                  Save Email Settings
                </button>
              </div>
            </div>

            <div className="email-section">
              <div className="email-section-header">
                <h3>Send Test Email</h3>
                <p>Send a quick test to verify SMTP settings.</p>
              </div>
              <div className="email-add-row">
                <input
                  placeholder="Test recipient (optional)"
                  value={emailTestTo}
                  onChange={(e) => setEmailTestTo(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    api.testEmail({ to: emailTestTo || undefined })
                      .then((res) => setMessage(res.message || "Test email sent"))
                      .catch((error) => setMessage(error.message || "Test email failed"));
                  }}
                >
                  Send Test
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {active === "analytics" ? (
          <div className="analytics-panel">
            <div className="analytics-hero">
              <h3>Website Analytics</h3>
              <p>
                Connect Google Analytics to see live data like visitors, countries, and conversions.
              </p>
              <div className="analytics-hero-actions">
                <button type="button" className="secondary">Connected</button>
                <button
                  type="button"
                  onClick={() => {
                    setAnalyticsLoading(true);
                    setAnalyticsError("");
                    api.getAnalyticsOverview()
                      .then((data) => {
                        setAnalyticsData({
                          summary: data.summary || null,
                          topCountries: Array.isArray(data.topCountries) ? data.topCountries : [],
                          topPages: Array.isArray(data.topPages) ? data.topPages : [],
                        });
                      })
                      .catch((error) => setAnalyticsError(error.message || "Failed to load analytics."))
                      .finally(() => setAnalyticsLoading(false));
                  }}
                >
                  Refresh
                </button>
              </div>
              {analyticsError ? <small className="field-error">{analyticsError}</small> : null}
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Total Users</h4>
                <div className="analytics-value">
                  {analyticsLoading ? "..." : analyticsData.summary?.totalUsers ?? "--"}
                </div>
                <small>Last 30 days</small>
              </div>
              <div className="analytics-card">
                <h4>Active Users</h4>
                <div className="analytics-value">
                  {analyticsLoading ? "..." : analyticsData.summary?.activeUsers ?? "--"}
                </div>
                <small>Today</small>
              </div>
              <div className="analytics-card">
                <h4>Sessions</h4>
                <div className="analytics-value">
                  {analyticsLoading ? "..." : analyticsData.summary?.sessions ?? "--"}
                </div>
                <small>Last 30 days</small>
              </div>
              <div className="analytics-card">
                <h4>Conversion Rate</h4>
                <div className="analytics-value">
                  {analyticsLoading ? "..." : analyticsData.summary?.conversions ?? "--"}
                </div>
                <small>Last 30 days</small>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card analytics-table-card">
                <h4>Top Countries</h4>
                <div className="analytics-table">
                  {(analyticsData.topCountries.length ? analyticsData.topCountries : []).map((row) => (
                    <div key={row.name}>
                      <span>{row.name}</span>
                      <span>{analyticsLoading ? "..." : row.users}</span>
                    </div>
                  ))}
                  {analyticsData.topCountries.length === 0 && !analyticsLoading ? (
                    <div><span>No data</span><span>--</span></div>
                  ) : null}
                </div>
              </div>
              <div className="analytics-card analytics-table-card">
                <h4>Top Pages</h4>
                <div className="analytics-table">
                  {(analyticsData.topPages.length ? analyticsData.topPages : []).map((row) => (
                    <div key={row.path}>
                      <span>{row.path === "/" ? "Home" : row.path}</span>
                      <span>{analyticsLoading ? "..." : row.views}</span>
                    </div>
                  ))}
                  {analyticsData.topPages.length === 0 && !analyticsLoading ? (
                    <div><span>No data</span><span>--</span></div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {active === "site" ? (
          <div className="panel-form">
            <h3>Site Settings</h3>
            <input placeholder="Company name" value={siteSettings.companyName || ""} onChange={(e) => setSiteSettings((s) => ({ ...s, companyName: e.target.value }))} />
            <input placeholder="Logo image path" value={siteSettings.logoPath || ""} onChange={(e) => setSiteSettings((s) => ({ ...s, logoPath: e.target.value }))} />
            <input type="file" accept="image/*" onChange={(e) => uploadFileToField(e.target.files?.[0], setSiteSettings, "logoPath")} />
            {siteSettings.logoPath ? <small>Logo: {siteSettings.logoPath}</small> : null}
            <input placeholder="Logo alt text" value={siteSettings.logoAlt || ""} onChange={(e) => setSiteSettings((s) => ({ ...s, logoAlt: e.target.value }))} />
            <textarea rows="3" placeholder="Footer description" value={siteSettings.footerDescription || ""} onChange={(e) => setSiteSettings((s) => ({ ...s, footerDescription: e.target.value }))} />
            <div className="catalog-grid-2">
              <input placeholder="Facebook URL" value={siteSettings.socialLinks?.FACEBOOK || ""} onChange={(e) => setSiteSettings((s) => ({ ...s, socialLinks: { ...(s.socialLinks || {}), FACEBOOK: e.target.value } }))} />
              <input placeholder="Instagram URL" value={siteSettings.socialLinks?.INSTAGRAM || ""} onChange={(e) => setSiteSettings((s) => ({ ...s, socialLinks: { ...(s.socialLinks || {}), INSTAGRAM: e.target.value } }))} />
            </div>
            <input placeholder="LinkedIn URL" value={siteSettings.socialLinks?.LINKEDIN || ""} onChange={(e) => setSiteSettings((s) => ({ ...s, socialLinks: { ...(s.socialLinks || {}), LINKEDIN: e.target.value } }))} />
            <div className="catalog-grid-2">
              <input placeholder="Developer name" value={siteSettings.developerName || ""} onChange={(e) => setSiteSettings((s) => ({ ...s, developerName: e.target.value }))} />
              <input placeholder="Developer URL" value={siteSettings.developerUrl || ""} onChange={(e) => setSiteSettings((s) => ({ ...s, developerUrl: e.target.value }))} />
            </div>
            <button onClick={() => upsertContent("siteSettings", "Site Settings", siteSettings).then(() => setMessage("Site settings saved"))}>Save Site Settings</button>
          </div>
        ) : null}
        {active === "media" ? (
          <>
            <div className="panel-form">
              <input type="file" onChange={uploadImage} />
              <small>Upload image and use URL like /uploads/filename in content sections.</small>
            </div>
            <table><thead><tr><th>Image URL</th><th>Preview</th><th>Actions</th></tr></thead><tbody>
              {mediaFiles.map((file) => (
                <tr key={file.name}>
                  <td>{file.url}</td>
                  <td><img src={resolveImageUrl(file.url)} alt={file.name} /></td>
                  <td>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        if (!window.confirm("Delete this media file?")) return;
                        api.deleteMedia(file.name)
                          .then(() => {
                            return api.getMedia().then((files) => {
                              setMediaFiles(Array.isArray(files) ? files : []);
                              setMessage("Media deleted");
                            });
                          })
                          .catch((error) => setMessage(error.message || "Failed to delete media"));
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody></table>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default DashboardPage;
