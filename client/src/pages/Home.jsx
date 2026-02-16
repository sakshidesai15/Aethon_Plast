import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Package, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useContentData from '../hooks/useContentData';
import { resolveMediaUrl } from '../utils/media';
const bannerBottles = '/assets/pharma_banner_bottles_1769614352905.png';
const bannerProduction = '/assets/pharma_banner_production_retry_1769615616299.png';
const bannerCaps = '/assets/pharma_banner_caps_retry_1769615514861.png';
import './Home.css';

const fallbackHomeContent = {
    slides: [
        {
            id: 1,
            image: bannerBottles,
            title: "Your Trusted Partner in",
            subtitle: "Plastic Packaging Excellence",
            text: "Premium pharmaceutical and cosmetic packaging solutions meeting international standards."
        },
        {
            id: 2,
            image: bannerProduction,
            title: "Advanced Manufacturing",
            subtitle: "State-of-the-Art Technology",
            text: "Precision engineering and clean-room facilities ensuring highest hygiene standards."
        },
        {
            id: 3,
            image: bannerCaps,
            title: "Innovative Solutions",
            subtitle: "Custom Caps & Closures",
            text: "Tailored designs to enhance brand identity and ensure product safety."
        }
    ],
    features: [
        {
            id: 'feature_1',
            title: 'Pharma Grade',
            text: 'Strict adherence to hygiene and regulatory compliance for medical packaging.'
        },
        {
            id: 'feature_2',
            title: 'Custom Molding',
            text: 'Tailored shapes and designs to make your brand stand out on the shelf.'
        },
        {
            id: 'feature_3',
            title: 'Quality Assured',
            text: 'Rigorous testing and quality control processes for consistent durability.'
        }
    ],
    aboutPreview: {
        title: 'Reliable Manufacturing Partner',
        description: 'At Aethon Plast, we combine advanced technology with manufacturing expertise to deliver superior packaging solutions. From startups to enterprises, we enable growth through quality.',
        buttonText: 'Learn More',
        stats: [
            { value: '0+', label: 'Units/Month' },
            { value: '0+', label: 'Clients' }
        ]
    }
};

const Home = () => {
    const { data: homeContent } = useContentData('homePage', fallbackHomeContent);
    const rawSlides = Array.isArray(homeContent?.slides) ? homeContent.slides : [];
    const slides = rawSlides.length >= fallbackHomeContent.slides.length
        ? rawSlides
        : [
            ...fallbackHomeContent.slides.map((fallbackSlide) => {
                const match = rawSlides.find((slide) => String(slide.id) === String(fallbackSlide.id));
                return match ? { ...fallbackSlide, ...match } : fallbackSlide;
            }),
            ...rawSlides.filter(
                (slide) => !fallbackHomeContent.slides.find((fb) => String(fb.id) === String(slide.id))
            ),
        ];
    const features = Array.isArray(homeContent?.features) && homeContent.features.length > 0
        ? homeContent.features
        : fallbackHomeContent.features;
    const aboutPreview = {
        ...fallbackHomeContent.aboutPreview,
        ...(homeContent?.aboutPreview || {}),
        stats: Array.isArray(homeContent?.aboutPreview?.stats) && homeContent.aboutPreview.stats.length > 0
            ? homeContent.aboutPreview.stats
            : fallbackHomeContent.aboutPreview.stats
    };
    const featureIcons = [ShieldCheck, Package, CheckCircle];

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    return (
        <div className="home-page">
            <section className="hero" style={{ backgroundImage: `url(${resolveMediaUrl(slides[currentSlide].image)})` }}>
                <div className="hero-overlay"></div>

                <div className="hero-arrow hero-prev" onClick={prevSlide}>
                    <ChevronLeft size={30} />
                </div>
                <div className="hero-arrow hero-next" onClick={nextSlide}>
                    <ChevronRight size={30} />
                </div>

                <div className="container hero-content fade-in-up">
                    <h1>{slides[currentSlide].title}</h1>
                    <span className="hero-title-sub">{slides[currentSlide].subtitle}</span>

                    <p>{slides[currentSlide].text}</p>

                    <div className="hero-btns">
                        <Link to="/products" className="btn btn-cta">Explore Our Products</Link>
                    </div>
                </div>

                <div className="slider-dots">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(index)}
                        ></div>
                    ))}
                </div>
            </section>

            <section className="section features-section">
                <div className="container">
                    <div className="feature-grid">
                        {features.map((feature, index) => {
                            const Icon = featureIcons[index] || CheckCircle;
                            return (
                                <div className="feature-card" key={feature.id || feature.title || index}>
                                    <div className="icon-box"><Icon size={32} /></div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.text}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="section bg-light">
                <div className="container about-preview">
                    <div className="about-text">
                        <h2>{aboutPreview.title}</h2>
                        <p>{aboutPreview.description}</p>
                        <Link to="/about" className="learn-more">{aboutPreview.buttonText} <ArrowRight size={16} /></Link>
                    </div>
                    <div className="about-stats">
                        {aboutPreview.stats.map((stat, index) => (
                            <div className="stat-item" key={`${stat.label}-${index}`}>
                                <h4>{stat.value}</h4>
                                <p>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
