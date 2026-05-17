-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('EN', 'NE', 'HI', 'ZH');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'COUNSELOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('HERO', 'RICH_TEXT', 'CTA', 'COUNTRY_GRID', 'ELIGIBILITY', 'VISA_RISK', 'COURSE_PATHWAYS', 'RESOURCE_LIST', 'TESTIMONIALS', 'STATS', 'FAQ', 'PROCESS_STEPS', 'BLOG_FEED', 'LEAD_FORM', 'COMPONENT_LIST', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NavLocation" AS ENUM ('HEADER', 'HEADER_SECONDARY', 'FOOTER', 'MOBILE');

-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('TEXT', 'EMAIL', 'PHONE', 'TEXTAREA', 'SELECT', 'MULTISELECT', 'CHECKBOX', 'RADIO', 'DATE', 'FILE', 'HIDDEN', 'COUNTRY_PICKER', 'COURSE_PICKER', 'RICH_TEXT');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('PDF', 'VIDEO', 'ARTICLE', 'CHECKLIST', 'TEMPLATE', 'EXTERNAL_LINK');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'IN_PROGRESS', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONSULTATION_BOOKED', 'CONSULTATION_DONE', 'APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'OFFER_RECEIVED', 'VISA_APPLIED', 'VISA_GRANTED', 'ENROLLED', 'LOST', 'DROPPED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('ELIGIBILITY_FORM', 'VISA_RISK_FORM', 'CONSULTATION_FORM', 'RESOURCE_DOWNLOAD', 'CONTACT_FORM', 'NEWSLETTER', 'CHAT_WIDGET', 'PHONE_CALL', 'WALK_IN', 'REFERRAL', 'AGENT', 'EVENT', 'MANUAL_ENTRY', 'IMPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FollowUpChannel" AS ENUM ('CALL', 'EMAIL', 'WHATSAPP', 'SMS', 'MEETING', 'VIDEO_CALL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'STAGE_CHANGED', 'ASSIGNED', 'UNASSIGNED', 'TAG_ADDED', 'TAG_REMOVED', 'NOTE_ADDED', 'FOLLOWUP_SCHEDULED', 'FOLLOWUP_COMPLETED', 'FOLLOWUP_MISSED', 'EMAIL_SENT', 'EMAIL_RECEIVED', 'WHATSAPP_SENT', 'WHATSAPP_RECEIVED', 'SMS_SENT', 'CALL_LOGGED', 'SCORE_RECOMPUTED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('CERTIFICATE', 'DIPLOMA', 'ADVANCED_DIPLOMA', 'BACHELORS', 'MASTERS', 'PHD');

-- CreateEnum
CREATE TYPE "DemandLevel" AS ENUM ('VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "SalaryPeriod" AS ENUM ('HOURLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "CareerLevel" AS ENUM ('ENTRY', 'MID', 'SENIOR', 'LEAD');

-- CreateEnum
CREATE TYPE "PrPathwayType" AS ENUM ('POST_STUDY_WORK', 'GRADUATE_VISA', 'SKILLED_INDEPENDENT', 'EMPLOYER_SPONSORED', 'REGIONAL', 'EXPRESS_ENTRY', 'INVESTOR', 'FAMILY', 'OTHER');

-- CreateEnum
CREATE TYPE "PrDifficulty" AS ENUM ('EASY', 'MODERATE', 'HARD', 'VERY_HARD');

-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('GROWING', 'STABLE', 'DECLINING');

-- CreateEnum
CREATE TYPE "BlogBodyFormat" AS ENUM ('HTML', 'MDX', 'LEXICAL_JSON');

-- CreateEnum
CREATE TYPE "BlogCtaPlacement" AS ENUM ('AFTER_INTRO', 'AFTER_HEADING', 'END_OF_POST', 'SIDEBAR', 'AFTER_PARAGRAPH');

-- CreateEnum
CREATE TYPE "BlogCtaVariant" AS ENUM ('INLINE', 'CARD', 'BANNER', 'LEAD_FORM');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'PAGE_LEAVE', 'CTA_CLICK', 'EXTERNAL_LINK_CLICK', 'PHONE_CLICK', 'EMAIL_CLICK', 'WHATSAPP_CLICK', 'SOCIAL_CLICK', 'FORM_VIEW', 'FORM_START', 'FORM_FIELD_CHANGE', 'FORM_FIELD_ERROR', 'FORM_STEP_COMPLETE', 'FORM_SUBMIT', 'FORM_SUCCESS', 'FORM_ERROR', 'FORM_ABANDONED', 'BLOG_VIEW', 'BLOG_SCROLL_25', 'BLOG_SCROLL_50', 'BLOG_SCROLL_75', 'BLOG_READ_COMPLETE', 'COUNTRY_VIEW', 'COURSE_VIEW', 'RESOURCE_VIEW', 'RESOURCE_DOWNLOAD', 'SEARCH_QUERY', 'SEARCH_RESULT_CLICK', 'LEAD_CREATED', 'LEAD_DEDUPLICATED', 'LEAD_STAGE_CHANGED', 'LEAD_STATUS_CHANGED', 'LEAD_ASSIGNED', 'LEAD_CONTACTED', 'LEAD_WON', 'LEAD_LOST', 'CHAT_WIDGET_OPEN', 'CHAT_WIDGET_MESSAGE', 'CONSULTATION_BOOKED', 'ELIGIBILITY_CHECKED', 'VISA_RISK_CHECKED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AnalyticsDevice" AS ENUM ('DESKTOP', 'TABLET', 'MOBILE', 'BOT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "HeatmapProvider" AS ENUM ('NONE', 'CLARITY', 'HOTJAR', 'POSTHOG', 'FULLSTORY');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGIN_LOCKED', 'LOGOUT', 'PASSWORD_CHANGED', 'SESSION_REVOKED', 'PERMISSION_DENIED', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'UNPUBLISH', 'EXPORT', 'IMPORT', 'RATE_LIMITED', 'CSRF_REJECTED');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
    "avatarUrl" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "sessionsInvalidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "caption" TEXT,
    "folder" TEXT DEFAULT 'uploads',
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoMeta" (
    "id" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "robots" TEXT DEFAULT 'index,follow',
    "ogImageUrl" TEXT,
    "twitterCardType" TEXT DEFAULT 'summary_large_image',
    "structuredData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoMetaTranslation" (
    "id" TEXT NOT NULL,
    "seoId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "keywords" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,

    CONSTRAINT "SeoMetaTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "template" TEXT,
    "isHomepage" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "seoId" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "ogImageUrl" TEXT,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageTranslation" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,

    CONSTRAINT "PageTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageVersion" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeNote" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "order" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "anchor" TEXT,
    "settings" JSONB,
    "heroId" TEXT,
    "ctaId" TEXT,
    "formId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionTranslation" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "eyebrow" TEXT,
    "heading" TEXT,
    "subheading" TEXT,
    "body" TEXT,

    CONSTRAINT "SectionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Component" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "props" JSONB NOT NULL,
    "isReusable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentTranslation" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "ComponentTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionComponent" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "overrides" JSONB,

    CONSTRAINT "SectionComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSection" (
    "id" TEXT NOT NULL,
    "variant" TEXT,
    "backgroundImage" TEXT,
    "backgroundVideo" TEXT,
    "overlayOpacity" DOUBLE PRECISION DEFAULT 0.4,
    "primaryCtaUrl" TEXT,
    "secondaryCtaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "HeroSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSectionTranslation" (
    "id" TEXT NOT NULL,
    "heroId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "eyebrow" TEXT,
    "headline" TEXT NOT NULL,
    "subheadline" TEXT,
    "primaryCtaLabel" TEXT,
    "secondaryCtaLabel" TEXT,

    CONSTRAINT "HeroSectionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "flagUrl" TEXT,
    "imageUrl" TEXT,
    "avgTuitionUsd" INTEGER,
    "visaSuccessRate" DOUBLE PRECISION,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryTranslation" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "shortIntro" TEXT,
    "description" TEXT,

    CONSTRAINT "CountryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionCountryCard" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "overrides" JSONB,

    CONSTRAINT "SectionCountryCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentPhotoUrl" TEXT,
    "universityName" TEXT,
    "programName" TEXT,
    "intakeYear" INTEGER,
    "rating" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "countryId" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestimonialTranslation" (
    "id" TEXT NOT NULL,
    "testimonialId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "quote" TEXT NOT NULL,
    "studentTitle" TEXT,

    CONSTRAINT "TestimonialTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionTestimonial" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "testimonialId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SectionTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CtaBlock" (
    "id" TEXT NOT NULL,
    "variant" TEXT,
    "backgroundImage" TEXT,
    "backgroundColor" TEXT,
    "primaryCtaUrl" TEXT,
    "secondaryCtaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CtaBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CtaBlockTranslation" (
    "id" TEXT NOT NULL,
    "ctaId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "heading" TEXT NOT NULL,
    "body" TEXT,
    "primaryCtaLabel" TEXT,
    "secondaryCtaLabel" TEXT,

    CONSTRAINT "CtaBlockTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "bodyFormat" "BlogBodyFormat" NOT NULL DEFAULT 'HTML',
    "coverImageUrl" TEXT,
    "coverImageAlt" TEXT,
    "readingMinutes" INTEGER,
    "wordCount" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "toc" JSONB,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "authorId" TEXT,
    "seoId" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostFaq" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPostFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostFaqTranslation" (
    "id" TEXT NOT NULL,
    "faqId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "BlogPostFaqTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostCta" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "placement" "BlogCtaPlacement" NOT NULL,
    "variant" "BlogCtaVariant" NOT NULL DEFAULT 'CARD',
    "anchor" TEXT,
    "paragraphIndex" INTEGER,
    "heading" TEXT NOT NULL,
    "body" TEXT,
    "primaryLabel" TEXT,
    "primaryUrl" TEXT,
    "secondaryLabel" TEXT,
    "secondaryUrl" TEXT,
    "formKey" TEXT,
    "backgroundImage" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPostCta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostCtaTranslation" (
    "id" TEXT NOT NULL,
    "ctaId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "heading" TEXT NOT NULL,
    "body" TEXT,
    "primaryLabel" TEXT,
    "secondaryLabel" TEXT,

    CONSTRAINT "BlogPostCtaTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostInternalLink" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "titleAttr" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BlogPostInternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostRelated" (
    "id" TEXT NOT NULL,
    "sourcePostId" TEXT NOT NULL,
    "targetPostId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BlogPostRelated_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostTranslation" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "bodyFormat" "BlogBodyFormat" NOT NULL DEFAULT 'HTML',
    "toc" JSONB,

    CONSTRAINT "BlogPostTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostVersion" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeNote" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPostVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "iconUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "seoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostCategory" (
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "BlogPostCategory_pkey" PRIMARY KEY ("postId","categoryId")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostTag" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "BlogPostTag_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "userId" TEXT,
    "avatarUrl" TEXT,
    "email" TEXT,
    "twitter" TEXT,
    "linkedin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorTranslation" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,

    CONSTRAINT "AuthorTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavMenu" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "location" "NavLocation" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavItem" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "iconKey" TEXT,
    "order" INTEGER NOT NULL,
    "openInNew" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "pageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavItemTranslation" (
    "id" TEXT NOT NULL,
    "navItemId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "label" TEXT NOT NULL,
    "badge" TEXT,

    CONSTRAINT "NavItemTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FooterColumn" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FooterColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FooterColumnTranslation" (
    "id" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "heading" TEXT NOT NULL,

    CONSTRAINT "FooterColumnTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FooterLink" (
    "id" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "openInNew" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "pageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FooterLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FooterLinkTranslation" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "FooterLinkTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "fileUrl" TEXT,
    "externalUrl" TEXT,
    "thumbnailUrl" TEXT,
    "fileSize" INTEGER,
    "pageCount" INTEGER,
    "gated" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceTranslation" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ResourceTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionResource" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SectionResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePathway" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "durationMonths" INTEGER,
    "avgTuitionUsd" INTEGER,
    "intakeMonths" TEXT,
    "countryId" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CoursePathway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePathwayTranslation" (
    "id" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,

    CONSTRAINT "CoursePathwayTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PathwayRequirement" (
    "id" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueNum" DOUBLE PRECISION,
    "valueText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PathwayRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PathwayRequirementTranslation" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "label" TEXT NOT NULL,
    "helpText" TEXT,

    CONSTRAINT "PathwayRequirementTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionCoursePathway" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SectionCoursePathway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaRiskRule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "countryId" TEXT,
    "riskLevel" "RiskLevel" NOT NULL,
    "score" INTEGER NOT NULL,
    "condition" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VisaRiskRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaRiskRuleTranslation" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "label" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "guidance" TEXT,

    CONSTRAINT "VisaRiskRuleTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadForm" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "successUrl" TEXT,
    "webhookUrl" TEXT,
    "emailTo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LeadForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadFormTranslation" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "heading" TEXT,
    "subheading" TEXT,
    "submitLabel" TEXT NOT NULL DEFAULT 'Submit',
    "successMessage" TEXT,

    CONSTRAINT "LeadFormTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadFormField" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FormFieldType" NOT NULL,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "validation" JSONB,
    "options" JSONB,
    "conditional" JSONB,

    CONSTRAINT "LeadFormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadFormFieldTranslation" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT,
    "helpText" TEXT,
    "optionLabels" JSONB,

    CONSTRAINT "LeadFormFieldTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadSubmission" (
    "id" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL DEFAULT 'OTHER',
    "formId" TEXT,
    "data" JSONB NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "countryCode" TEXT,
    "preferredIntake" TEXT,
    "budgetUsd" INTEGER,
    "ielts" DOUBLE PRECISION,
    "gpa" DOUBLE PRECISION,
    "sourceUrl" TEXT,
    "referrerUrl" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "locale" "Locale",
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
    "temperature" "LeadTemperature" NOT NULL DEFAULT 'WARM',
    "priority" "LeadPriority" NOT NULL DEFAULT 'NORMAL',
    "score" INTEGER NOT NULL DEFAULT 0,
    "scoreBreakdown" JSONB,
    "visaRiskLevel" "RiskLevel",
    "visaRiskScore" INTEGER,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "contactAttempts" INTEGER NOT NULL DEFAULT 0,
    "closedAt" TIMESTAMP(3),
    "closeReason" TEXT,
    "resourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LeadSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadFollowUp" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" "FollowUpChannel" NOT NULL,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "outcome" TEXT,
    "assignedToId" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "payload" JSONB,
    "summary" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LeadTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTagOnLead" (
    "leadId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadTagOnLead_pkey" PRIMARY KEY ("leadId","tagId")
);

-- CreateTable
CREATE TABLE "LeadMessage" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "toAddress" TEXT,
    "fromAddress" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "templateKey" TEXT,
    "templateParams" JSONB,
    "providerMessageId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "triggeredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettingTranslation" (
    "id" TEXT NOT NULL,
    "settingId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "SiteSettingTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteTheme" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isDarkMode" BOOLEAN NOT NULL DEFAULT false,
    "tokens" JSONB NOT NULL,
    "radius" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "fontHeading" TEXT,
    "fontBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT,
    "level" "CourseLevel" NOT NULL,
    "field" TEXT NOT NULL,
    "discipline" TEXT,
    "durationMonths" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseTranslation" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "shortIntro" TEXT,
    "description" TEXT,

    CONSTRAINT "CourseTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseCountryMapping" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "avgTuitionUsd" INTEGER,
    "livingCostUsd" INTEGER,
    "intakeMonths" TEXT,
    "topUniversities" JSONB,
    "prEligible" BOOLEAN NOT NULL DEFAULT false,
    "graduateVisaMonths" INTEGER,
    "notes" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseCountryMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrPathway" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "type" "PrPathwayType" NOT NULL,
    "difficulty" "PrDifficulty" NOT NULL DEFAULT 'MODERATE',
    "minYearsToPr" INTEGER,
    "pointsRequired" INTEGER,
    "ageLimit" INTEGER,
    "englishMinBand" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "externalUrl" TEXT,
    "seoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PrPathway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrPathwayTranslation" (
    "id" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT,

    CONSTRAINT "PrPathwayTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrPathwayStep" (
    "id" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "durationMonths" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrPathwayStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrPathwayStepTranslation" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,

    CONSTRAINT "PrPathwayStepTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrPathwayOnCourseMapping" (
    "mappingId" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrPathwayOnCourseMapping_pkey" PRIMARY KEY ("mappingId","pathwayId")
);

-- CreateTable
CREATE TABLE "CourseCareerOutcome" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "anzscoCode" TEXT,
    "fitScore" INTEGER NOT NULL DEFAULT 70,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseCareerOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseCareerOutcomeTranslation" (
    "id" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "blurb" TEXT,

    CONSTRAINT "CourseCareerOutcomeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryEstimate" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "countryId" TEXT NOT NULL,
    "occupation" TEXT,
    "level" "CareerLevel" NOT NULL,
    "period" "SalaryPeriod" NOT NULL DEFAULT 'YEARLY',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "minAmount" INTEGER NOT NULL,
    "midAmount" INTEGER NOT NULL,
    "maxAmount" INTEGER NOT NULL,
    "effectiveYear" INTEGER NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandSignal" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "countryId" TEXT NOT NULL,
    "occupation" TEXT,
    "demandLevel" "DemandLevel" NOT NULL,
    "shortageListed" BOOLEAN NOT NULL DEFAULT false,
    "vacancies12mo" INTEGER,
    "growthPercent" DOUBLE PRECISION,
    "effectiveYear" INTEGER NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemandSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerTrend" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "countryId" TEXT,
    "occupation" TEXT,
    "year" INTEGER NOT NULL,
    "direction" "TrendDirection" NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerRecommendation" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "profile" JSONB NOT NULL,
    "ranked" JSONB NOT NULL,
    "topCourseId" TEXT,
    "topCountryId" TEXT,
    "locale" "Locale",
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "name" TEXT,
    "anonId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "leadId" TEXT,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "pageId" TEXT,
    "blogPostId" TEXT,
    "countryId" TEXT,
    "courseId" TEXT,
    "resourceId" TEXT,
    "formId" TEXT,
    "ctaId" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "fieldName" TEXT,
    "formStep" INTEGER,
    "errorMessage" TEXT,
    "properties" JSONB,
    "value" DOUBLE PRECISION,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "countryCode" TEXT,
    "region" TEXT,
    "city" TEXT,
    "device" "AnalyticsDevice" NOT NULL DEFAULT 'UNKNOWN',
    "browser" TEXT,
    "os" TEXT,
    "locale" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSession" (
    "id" TEXT NOT NULL,
    "anonId" TEXT NOT NULL,
    "landingPath" TEXT NOT NULL,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "device" "AnalyticsDevice" NOT NULL DEFAULT 'UNKNOWN',
    "browser" TEXT,
    "os" TEXT,
    "countryCode" TEXT,
    "region" TEXT,
    "city" TEXT,
    "locale" TEXT,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "durationS" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "leadId" TEXT,

    CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoQueryDaily" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "query" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "countryCode" TEXT DEFAULT 'ALL',
    "device" TEXT DEFAULT 'ALL',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeoQueryDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoPageDaily" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "path" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "avgPosition" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeoPageDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "ga4MeasurementId" TEXT,
    "gtmContainerId" TEXT,
    "metaPixelId" TEXT,
    "heatmapProvider" "HeatmapProvider" NOT NULL DEFAULT 'NONE',
    "clarityProjectId" TEXT,
    "hotjarSiteId" TEXT,
    "posthogApiKey" TEXT,
    "posthogHost" TEXT,
    "fullstoryOrgId" TEXT,
    "respectDoNotTrack" BOOLEAN NOT NULL DEFAULT true,
    "ipHashSalt" TEXT,
    "requireConsent" BOOLEAN NOT NULL DEFAULT false,
    "gscSiteUrl" TEXT,
    "gscLastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunnelDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "windowHours" INTEGER NOT NULL DEFAULT 168,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunnelDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunnelDailyRollup" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "stepStats" JSONB NOT NULL,
    "entrants" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunnelDailyRollup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'SUCCESS',
    "entity" TEXT,
    "entityId" TEXT,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" "UserRole",
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Media_key_key" ON "Media"("key");

-- CreateIndex
CREATE INDEX "Media_folder_idx" ON "Media"("folder");

-- CreateIndex
CREATE INDEX "Media_mimeType_idx" ON "Media"("mimeType");

-- CreateIndex
CREATE INDEX "Media_deletedAt_idx" ON "Media"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SeoMetaTranslation_seoId_locale_key" ON "SeoMetaTranslation"("seoId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Page_seoId_key" ON "Page"("seoId");

-- CreateIndex
CREATE INDEX "Page_status_publishedAt_idx" ON "Page"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Page_isHomepage_idx" ON "Page"("isHomepage");

-- CreateIndex
CREATE INDEX "Page_deletedAt_idx" ON "Page"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Page_parentId_slug_key" ON "Page"("parentId", "slug");

-- CreateIndex
CREATE INDEX "PageTranslation_locale_idx" ON "PageTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "PageTranslation_pageId_locale_key" ON "PageTranslation"("pageId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "PageTranslation_locale_slug_key" ON "PageTranslation"("locale", "slug");

-- CreateIndex
CREATE INDEX "PageVersion_pageId_createdAt_idx" ON "PageVersion"("pageId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PageVersion_pageId_version_key" ON "PageVersion"("pageId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Section_heroId_key" ON "Section"("heroId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_ctaId_key" ON "Section"("ctaId");

-- CreateIndex
CREATE INDEX "Section_pageId_order_idx" ON "Section"("pageId", "order");

-- CreateIndex
CREATE INDEX "Section_type_idx" ON "Section"("type");

-- CreateIndex
CREATE UNIQUE INDEX "SectionTranslation_sectionId_locale_key" ON "SectionTranslation"("sectionId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Component_key_key" ON "Component"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ComponentTranslation_componentId_locale_key" ON "ComponentTranslation"("componentId", "locale");

-- CreateIndex
CREATE INDEX "SectionComponent_sectionId_order_idx" ON "SectionComponent"("sectionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SectionComponent_sectionId_componentId_order_key" ON "SectionComponent"("sectionId", "componentId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "HeroSectionTranslation_heroId_locale_key" ON "HeroSectionTranslation"("heroId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Country_slug_key" ON "Country"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Country_seoId_key" ON "Country"("seoId");

-- CreateIndex
CREATE INDEX "Country_status_publishedAt_idx" ON "Country"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Country_isFeatured_popularity_idx" ON "Country"("isFeatured", "popularity");

-- CreateIndex
CREATE INDEX "Country_deletedAt_idx" ON "Country"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CountryTranslation_countryId_locale_key" ON "CountryTranslation"("countryId", "locale");

-- CreateIndex
CREATE INDEX "SectionCountryCard_sectionId_order_idx" ON "SectionCountryCard"("sectionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SectionCountryCard_sectionId_countryId_key" ON "SectionCountryCard"("sectionId", "countryId");

-- CreateIndex
CREATE INDEX "Testimonial_status_publishedAt_idx" ON "Testimonial"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Testimonial_isFeatured_idx" ON "Testimonial"("isFeatured");

-- CreateIndex
CREATE INDEX "Testimonial_deletedAt_idx" ON "Testimonial"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TestimonialTranslation_testimonialId_locale_key" ON "TestimonialTranslation"("testimonialId", "locale");

-- CreateIndex
CREATE INDEX "SectionTestimonial_sectionId_order_idx" ON "SectionTestimonial"("sectionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SectionTestimonial_sectionId_testimonialId_key" ON "SectionTestimonial"("sectionId", "testimonialId");

-- CreateIndex
CREATE UNIQUE INDEX "CtaBlockTranslation_ctaId_locale_key" ON "CtaBlockTranslation"("ctaId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_seoId_key" ON "BlogPost"("seoId");

-- CreateIndex
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_authorId_idx" ON "BlogPost"("authorId");

-- CreateIndex
CREATE INDEX "BlogPost_isFeatured_idx" ON "BlogPost"("isFeatured");

-- CreateIndex
CREATE INDEX "BlogPost_deletedAt_idx" ON "BlogPost"("deletedAt");

-- CreateIndex
CREATE INDEX "BlogPostFaq_postId_order_idx" ON "BlogPostFaq"("postId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostFaqTranslation_faqId_locale_key" ON "BlogPostFaqTranslation"("faqId", "locale");

-- CreateIndex
CREATE INDEX "BlogPostCta_postId_order_idx" ON "BlogPostCta"("postId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostCtaTranslation_ctaId_locale_key" ON "BlogPostCtaTranslation"("ctaId", "locale");

-- CreateIndex
CREATE INDEX "BlogPostInternalLink_postId_order_idx" ON "BlogPostInternalLink"("postId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostInternalLink_postId_keyword_key" ON "BlogPostInternalLink"("postId", "keyword");

-- CreateIndex
CREATE INDEX "BlogPostRelated_sourcePostId_order_idx" ON "BlogPostRelated"("sourcePostId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostRelated_sourcePostId_targetPostId_key" ON "BlogPostRelated"("sourcePostId", "targetPostId");

-- CreateIndex
CREATE INDEX "BlogPostTranslation_locale_idx" ON "BlogPostTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostTranslation_postId_locale_key" ON "BlogPostTranslation"("postId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostTranslation_locale_slug_key" ON "BlogPostTranslation"("locale", "slug");

-- CreateIndex
CREATE INDEX "BlogPostVersion_postId_createdAt_idx" ON "BlogPostVersion"("postId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostVersion_postId_version_key" ON "BlogPostVersion"("postId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_seoId_key" ON "Category"("seoId");

-- CreateIndex
CREATE INDEX "Category_deletedAt_idx" ON "Category"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_locale_key" ON "CategoryTranslation"("categoryId", "locale");

-- CreateIndex
CREATE INDEX "BlogPostCategory_categoryId_idx" ON "BlogPostCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "BlogPostTag_tagId_idx" ON "BlogPostTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Author_slug_key" ON "Author"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Author_userId_key" ON "Author"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorTranslation_authorId_locale_key" ON "AuthorTranslation"("authorId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "NavMenu_key_key" ON "NavMenu"("key");

-- CreateIndex
CREATE INDEX "NavItem_menuId_parentId_order_idx" ON "NavItem"("menuId", "parentId", "order");

-- CreateIndex
CREATE INDEX "NavItem_pageId_idx" ON "NavItem"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "NavItemTranslation_navItemId_locale_key" ON "NavItemTranslation"("navItemId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "FooterColumn_key_key" ON "FooterColumn"("key");

-- CreateIndex
CREATE UNIQUE INDEX "FooterColumnTranslation_columnId_locale_key" ON "FooterColumnTranslation"("columnId", "locale");

-- CreateIndex
CREATE INDEX "FooterLink_columnId_order_idx" ON "FooterLink"("columnId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "FooterLinkTranslation_linkId_locale_key" ON "FooterLinkTranslation"("linkId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_slug_key" ON "Resource"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_seoId_key" ON "Resource"("seoId");

-- CreateIndex
CREATE INDEX "Resource_type_idx" ON "Resource"("type");

-- CreateIndex
CREATE INDEX "Resource_status_publishedAt_idx" ON "Resource"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Resource_deletedAt_idx" ON "Resource"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceTranslation_resourceId_locale_key" ON "ResourceTranslation"("resourceId", "locale");

-- CreateIndex
CREATE INDEX "SectionResource_sectionId_order_idx" ON "SectionResource"("sectionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SectionResource_sectionId_resourceId_key" ON "SectionResource"("sectionId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePathway_slug_key" ON "CoursePathway"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePathway_seoId_key" ON "CoursePathway"("seoId");

-- CreateIndex
CREATE INDEX "CoursePathway_countryId_level_field_idx" ON "CoursePathway"("countryId", "level", "field");

-- CreateIndex
CREATE INDEX "CoursePathway_status_publishedAt_idx" ON "CoursePathway"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "CoursePathway_deletedAt_idx" ON "CoursePathway"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePathwayTranslation_pathwayId_locale_key" ON "CoursePathwayTranslation"("pathwayId", "locale");

-- CreateIndex
CREATE INDEX "PathwayRequirement_pathwayId_order_idx" ON "PathwayRequirement"("pathwayId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PathwayRequirementTranslation_requirementId_locale_key" ON "PathwayRequirementTranslation"("requirementId", "locale");

-- CreateIndex
CREATE INDEX "SectionCoursePathway_sectionId_order_idx" ON "SectionCoursePathway"("sectionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SectionCoursePathway_sectionId_pathwayId_key" ON "SectionCoursePathway"("sectionId", "pathwayId");

-- CreateIndex
CREATE UNIQUE INDEX "VisaRiskRule_key_key" ON "VisaRiskRule"("key");

-- CreateIndex
CREATE INDEX "VisaRiskRule_countryId_isActive_priority_idx" ON "VisaRiskRule"("countryId", "isActive", "priority");

-- CreateIndex
CREATE INDEX "VisaRiskRule_deletedAt_idx" ON "VisaRiskRule"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VisaRiskRuleTranslation_ruleId_locale_key" ON "VisaRiskRuleTranslation"("ruleId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "LeadForm_key_key" ON "LeadForm"("key");

-- CreateIndex
CREATE UNIQUE INDEX "LeadFormTranslation_formId_locale_key" ON "LeadFormTranslation"("formId", "locale");

-- CreateIndex
CREATE INDEX "LeadFormField_formId_order_idx" ON "LeadFormField"("formId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "LeadFormField_formId_name_key" ON "LeadFormField"("formId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LeadFormFieldTranslation_fieldId_locale_key" ON "LeadFormFieldTranslation"("fieldId", "locale");

-- CreateIndex
CREATE INDEX "LeadSubmission_formId_createdAt_idx" ON "LeadSubmission"("formId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadSubmission_source_createdAt_idx" ON "LeadSubmission"("source", "createdAt");

-- CreateIndex
CREATE INDEX "LeadSubmission_status_idx" ON "LeadSubmission"("status");

-- CreateIndex
CREATE INDEX "LeadSubmission_stage_idx" ON "LeadSubmission"("stage");

-- CreateIndex
CREATE INDEX "LeadSubmission_temperature_idx" ON "LeadSubmission"("temperature");

-- CreateIndex
CREATE INDEX "LeadSubmission_priority_idx" ON "LeadSubmission"("priority");

-- CreateIndex
CREATE INDEX "LeadSubmission_assignedToId_idx" ON "LeadSubmission"("assignedToId");

-- CreateIndex
CREATE INDEX "LeadSubmission_email_idx" ON "LeadSubmission"("email");

-- CreateIndex
CREATE INDEX "LeadSubmission_phone_idx" ON "LeadSubmission"("phone");

-- CreateIndex
CREATE INDEX "LeadSubmission_countryCode_idx" ON "LeadSubmission"("countryCode");

-- CreateIndex
CREATE INDEX "LeadSubmission_nextFollowUpAt_idx" ON "LeadSubmission"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "LeadSubmission_lastContactedAt_idx" ON "LeadSubmission"("lastContactedAt");

-- CreateIndex
CREATE INDEX "LeadSubmission_score_idx" ON "LeadSubmission"("score");

-- CreateIndex
CREATE INDEX "LeadSubmission_deletedAt_idx" ON "LeadSubmission"("deletedAt");

-- CreateIndex
CREATE INDEX "LeadSubmission_createdAt_idx" ON "LeadSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "LeadNote_leadId_createdAt_idx" ON "LeadNote"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadNote_deletedAt_idx" ON "LeadNote"("deletedAt");

-- CreateIndex
CREATE INDEX "LeadFollowUp_leadId_dueAt_idx" ON "LeadFollowUp"("leadId", "dueAt");

-- CreateIndex
CREATE INDEX "LeadFollowUp_status_dueAt_idx" ON "LeadFollowUp"("status", "dueAt");

-- CreateIndex
CREATE INDEX "LeadFollowUp_assignedToId_dueAt_idx" ON "LeadFollowUp"("assignedToId", "dueAt");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_createdAt_idx" ON "LeadActivity"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadActivity_type_idx" ON "LeadActivity"("type");

-- CreateIndex
CREATE UNIQUE INDEX "LeadTag_slug_key" ON "LeadTag"("slug");

-- CreateIndex
CREATE INDEX "LeadTagOnLead_tagId_idx" ON "LeadTagOnLead"("tagId");

-- CreateIndex
CREATE INDEX "LeadMessage_leadId_createdAt_idx" ON "LeadMessage"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadMessage_channel_status_idx" ON "LeadMessage"("channel", "status");

-- CreateIndex
CREATE INDEX "LeadMessage_providerMessageId_idx" ON "LeadMessage"("providerMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- CreateIndex
CREATE INDEX "SiteSetting_group_idx" ON "SiteSetting"("group");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettingTranslation_settingId_locale_key" ON "SiteSettingTranslation"("settingId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "SiteTheme_key_key" ON "SiteTheme"("key");

-- CreateIndex
CREATE INDEX "SiteTheme_isActive_idx" ON "SiteTheme"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Course_seoId_key" ON "Course"("seoId");

-- CreateIndex
CREATE INDEX "Course_status_publishedAt_idx" ON "Course"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Course_isFeatured_popularity_idx" ON "Course"("isFeatured", "popularity");

-- CreateIndex
CREATE INDEX "Course_field_idx" ON "Course"("field");

-- CreateIndex
CREATE INDEX "Course_discipline_idx" ON "Course"("discipline");

-- CreateIndex
CREATE INDEX "Course_deletedAt_idx" ON "Course"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTranslation_courseId_locale_key" ON "CourseTranslation"("courseId", "locale");

-- CreateIndex
CREATE INDEX "CourseCountryMapping_countryId_idx" ON "CourseCountryMapping"("countryId");

-- CreateIndex
CREATE INDEX "CourseCountryMapping_prEligible_idx" ON "CourseCountryMapping"("prEligible");

-- CreateIndex
CREATE UNIQUE INDEX "CourseCountryMapping_courseId_countryId_key" ON "CourseCountryMapping"("courseId", "countryId");

-- CreateIndex
CREATE UNIQUE INDEX "PrPathway_slug_key" ON "PrPathway"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PrPathway_seoId_key" ON "PrPathway"("seoId");

-- CreateIndex
CREATE INDEX "PrPathway_countryId_isActive_priority_idx" ON "PrPathway"("countryId", "isActive", "priority");

-- CreateIndex
CREATE INDEX "PrPathway_type_idx" ON "PrPathway"("type");

-- CreateIndex
CREATE INDEX "PrPathway_deletedAt_idx" ON "PrPathway"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PrPathwayTranslation_pathwayId_locale_key" ON "PrPathwayTranslation"("pathwayId", "locale");

-- CreateIndex
CREATE INDEX "PrPathwayStep_pathwayId_order_idx" ON "PrPathwayStep"("pathwayId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PrPathwayStepTranslation_stepId_locale_key" ON "PrPathwayStepTranslation"("stepId", "locale");

-- CreateIndex
CREATE INDEX "PrPathwayOnCourseMapping_pathwayId_idx" ON "PrPathwayOnCourseMapping"("pathwayId");

-- CreateIndex
CREATE INDEX "CourseCareerOutcome_courseId_order_idx" ON "CourseCareerOutcome"("courseId", "order");

-- CreateIndex
CREATE INDEX "CourseCareerOutcome_occupation_idx" ON "CourseCareerOutcome"("occupation");

-- CreateIndex
CREATE UNIQUE INDEX "CourseCareerOutcomeTranslation_outcomeId_locale_key" ON "CourseCareerOutcomeTranslation"("outcomeId", "locale");

-- CreateIndex
CREATE INDEX "SalaryEstimate_countryId_level_idx" ON "SalaryEstimate"("countryId", "level");

-- CreateIndex
CREATE INDEX "SalaryEstimate_occupation_idx" ON "SalaryEstimate"("occupation");

-- CreateIndex
CREATE INDEX "SalaryEstimate_effectiveYear_idx" ON "SalaryEstimate"("effectiveYear");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryEstimate_courseId_countryId_occupation_level_effectiv_key" ON "SalaryEstimate"("courseId", "countryId", "occupation", "level", "effectiveYear");

-- CreateIndex
CREATE INDEX "DemandSignal_countryId_demandLevel_idx" ON "DemandSignal"("countryId", "demandLevel");

-- CreateIndex
CREATE INDEX "DemandSignal_occupation_idx" ON "DemandSignal"("occupation");

-- CreateIndex
CREATE INDEX "DemandSignal_effectiveYear_idx" ON "DemandSignal"("effectiveYear");

-- CreateIndex
CREATE UNIQUE INDEX "DemandSignal_courseId_countryId_occupation_effectiveYear_key" ON "DemandSignal"("courseId", "countryId", "occupation", "effectiveYear");

-- CreateIndex
CREATE INDEX "CareerTrend_courseId_countryId_year_idx" ON "CareerTrend"("courseId", "countryId", "year");

-- CreateIndex
CREATE INDEX "CareerTrend_occupation_year_idx" ON "CareerTrend"("occupation", "year");

-- CreateIndex
CREATE INDEX "CareerTrend_year_idx" ON "CareerTrend"("year");

-- CreateIndex
CREATE INDEX "CareerRecommendation_leadId_idx" ON "CareerRecommendation"("leadId");

-- CreateIndex
CREATE INDEX "CareerRecommendation_createdAt_idx" ON "CareerRecommendation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_fromPath_key" ON "Redirect"("fromPath");

-- CreateIndex
CREATE INDEX "Redirect_isActive_idx" ON "Redirect"("isActive");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_anonId_createdAt_idx" ON "AnalyticsEvent"("anonId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_createdAt_idx" ON "AnalyticsEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_leadId_idx" ON "AnalyticsEvent"("leadId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_path_createdAt_idx" ON "AnalyticsEvent"("path", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_ctaId_createdAt_idx" ON "AnalyticsEvent"("ctaId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_formId_createdAt_idx" ON "AnalyticsEvent"("formId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_pageId_createdAt_idx" ON "AnalyticsEvent"("pageId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_countryId_createdAt_idx" ON "AnalyticsEvent"("countryId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_utmSource_createdAt_idx" ON "AnalyticsEvent"("utmSource", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_countryCode_createdAt_idx" ON "AnalyticsEvent"("countryCode", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_anonId_startedAt_idx" ON "AnalyticsSession"("anonId", "startedAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_leadId_idx" ON "AnalyticsSession"("leadId");

-- CreateIndex
CREATE INDEX "AnalyticsSession_startedAt_idx" ON "AnalyticsSession"("startedAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_utmSource_startedAt_idx" ON "AnalyticsSession"("utmSource", "startedAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_countryCode_startedAt_idx" ON "AnalyticsSession"("countryCode", "startedAt");

-- CreateIndex
CREATE INDEX "SeoQueryDaily_date_idx" ON "SeoQueryDaily"("date");

-- CreateIndex
CREATE INDEX "SeoQueryDaily_query_idx" ON "SeoQueryDaily"("query");

-- CreateIndex
CREATE INDEX "SeoQueryDaily_page_date_idx" ON "SeoQueryDaily"("page", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SeoQueryDaily_date_query_page_countryCode_device_key" ON "SeoQueryDaily"("date", "query", "page", "countryCode", "device");

-- CreateIndex
CREATE INDEX "SeoPageDaily_date_idx" ON "SeoPageDaily"("date");

-- CreateIndex
CREATE INDEX "SeoPageDaily_path_date_idx" ON "SeoPageDaily"("path", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SeoPageDaily_date_path_key" ON "SeoPageDaily"("date", "path");

-- CreateIndex
CREATE UNIQUE INDEX "FunnelDefinition_slug_key" ON "FunnelDefinition"("slug");

-- CreateIndex
CREATE INDEX "FunnelDefinition_isActive_idx" ON "FunnelDefinition"("isActive");

-- CreateIndex
CREATE INDEX "FunnelDailyRollup_date_idx" ON "FunnelDailyRollup"("date");

-- CreateIndex
CREATE UNIQUE INDEX "FunnelDailyRollup_funnelId_date_key" ON "FunnelDailyRollup"("funnelId", "date");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoMetaTranslation" ADD CONSTRAINT "SeoMetaTranslation_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "SeoMeta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageTranslation" ADD CONSTRAINT "PageTranslation_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "HeroSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_ctaId_fkey" FOREIGN KEY ("ctaId") REFERENCES "CtaBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_formId_fkey" FOREIGN KEY ("formId") REFERENCES "LeadForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionTranslation" ADD CONSTRAINT "SectionTranslation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentTranslation" ADD CONSTRAINT "ComponentTranslation_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionComponent" ADD CONSTRAINT "SectionComponent_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionComponent" ADD CONSTRAINT "SectionComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeroSectionTranslation" ADD CONSTRAINT "HeroSectionTranslation_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "HeroSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Country" ADD CONSTRAINT "Country_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryTranslation" ADD CONSTRAINT "CountryTranslation_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionCountryCard" ADD CONSTRAINT "SectionCountryCard_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionCountryCard" ADD CONSTRAINT "SectionCountryCard_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestimonialTranslation" ADD CONSTRAINT "TestimonialTranslation_testimonialId_fkey" FOREIGN KEY ("testimonialId") REFERENCES "Testimonial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionTestimonial" ADD CONSTRAINT "SectionTestimonial_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionTestimonial" ADD CONSTRAINT "SectionTestimonial_testimonialId_fkey" FOREIGN KEY ("testimonialId") REFERENCES "Testimonial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CtaBlockTranslation" ADD CONSTRAINT "CtaBlockTranslation_ctaId_fkey" FOREIGN KEY ("ctaId") REFERENCES "CtaBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostFaq" ADD CONSTRAINT "BlogPostFaq_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostFaqTranslation" ADD CONSTRAINT "BlogPostFaqTranslation_faqId_fkey" FOREIGN KEY ("faqId") REFERENCES "BlogPostFaq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostCta" ADD CONSTRAINT "BlogPostCta_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostCtaTranslation" ADD CONSTRAINT "BlogPostCtaTranslation_ctaId_fkey" FOREIGN KEY ("ctaId") REFERENCES "BlogPostCta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostInternalLink" ADD CONSTRAINT "BlogPostInternalLink_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostRelated" ADD CONSTRAINT "BlogPostRelated_sourcePostId_fkey" FOREIGN KEY ("sourcePostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostRelated" ADD CONSTRAINT "BlogPostRelated_targetPostId_fkey" FOREIGN KEY ("targetPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostTranslation" ADD CONSTRAINT "BlogPostTranslation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostVersion" ADD CONSTRAINT "BlogPostVersion_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostVersion" ADD CONSTRAINT "BlogPostVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostCategory" ADD CONSTRAINT "BlogPostCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostCategory" ADD CONSTRAINT "BlogPostCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Author" ADD CONSTRAINT "Author_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorTranslation" ADD CONSTRAINT "AuthorTranslation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavItem" ADD CONSTRAINT "NavItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "NavMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavItem" ADD CONSTRAINT "NavItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NavItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavItem" ADD CONSTRAINT "NavItem_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavItemTranslation" ADD CONSTRAINT "NavItemTranslation_navItemId_fkey" FOREIGN KEY ("navItemId") REFERENCES "NavItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FooterColumnTranslation" ADD CONSTRAINT "FooterColumnTranslation_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "FooterColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FooterLink" ADD CONSTRAINT "FooterLink_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "FooterColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FooterLink" ADD CONSTRAINT "FooterLink_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FooterLinkTranslation" ADD CONSTRAINT "FooterLinkTranslation_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "FooterLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceTranslation" ADD CONSTRAINT "ResourceTranslation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionResource" ADD CONSTRAINT "SectionResource_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionResource" ADD CONSTRAINT "SectionResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePathway" ADD CONSTRAINT "CoursePathway_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePathway" ADD CONSTRAINT "CoursePathway_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePathwayTranslation" ADD CONSTRAINT "CoursePathwayTranslation_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "CoursePathway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathwayRequirement" ADD CONSTRAINT "PathwayRequirement_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "CoursePathway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathwayRequirementTranslation" ADD CONSTRAINT "PathwayRequirementTranslation_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "PathwayRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionCoursePathway" ADD CONSTRAINT "SectionCoursePathway_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionCoursePathway" ADD CONSTRAINT "SectionCoursePathway_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "CoursePathway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaRiskRule" ADD CONSTRAINT "VisaRiskRule_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaRiskRuleTranslation" ADD CONSTRAINT "VisaRiskRuleTranslation_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "VisaRiskRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFormTranslation" ADD CONSTRAINT "LeadFormTranslation_formId_fkey" FOREIGN KEY ("formId") REFERENCES "LeadForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFormField" ADD CONSTRAINT "LeadFormField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "LeadForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFormFieldTranslation" ADD CONSTRAINT "LeadFormFieldTranslation_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "LeadFormField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSubmission" ADD CONSTRAINT "LeadSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "LeadForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSubmission" ADD CONSTRAINT "LeadSubmission_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSubmission" ADD CONSTRAINT "LeadSubmission_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFollowUp" ADD CONSTRAINT "LeadFollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFollowUp" ADD CONSTRAINT "LeadFollowUp_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFollowUp" ADD CONSTRAINT "LeadFollowUp_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTagOnLead" ADD CONSTRAINT "LeadTagOnLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTagOnLead" ADD CONSTRAINT "LeadTagOnLead_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "LeadTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMessage" ADD CONSTRAINT "LeadMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMessage" ADD CONSTRAINT "LeadMessage_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettingTranslation" ADD CONSTRAINT "SiteSettingTranslation_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES "SiteSetting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTranslation" ADD CONSTRAINT "CourseTranslation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCountryMapping" ADD CONSTRAINT "CourseCountryMapping_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCountryMapping" ADD CONSTRAINT "CourseCountryMapping_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrPathway" ADD CONSTRAINT "PrPathway_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrPathway" ADD CONSTRAINT "PrPathway_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrPathwayTranslation" ADD CONSTRAINT "PrPathwayTranslation_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "PrPathway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrPathwayStep" ADD CONSTRAINT "PrPathwayStep_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "PrPathway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrPathwayStepTranslation" ADD CONSTRAINT "PrPathwayStepTranslation_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "PrPathwayStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrPathwayOnCourseMapping" ADD CONSTRAINT "PrPathwayOnCourseMapping_mappingId_fkey" FOREIGN KEY ("mappingId") REFERENCES "CourseCountryMapping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrPathwayOnCourseMapping" ADD CONSTRAINT "PrPathwayOnCourseMapping_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "PrPathway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCareerOutcome" ADD CONSTRAINT "CourseCareerOutcome_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCareerOutcomeTranslation" ADD CONSTRAINT "CourseCareerOutcomeTranslation_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "CourseCareerOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryEstimate" ADD CONSTRAINT "SalaryEstimate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryEstimate" ADD CONSTRAINT "SalaryEstimate_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandSignal" ADD CONSTRAINT "DemandSignal_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandSignal" ADD CONSTRAINT "DemandSignal_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerTrend" ADD CONSTRAINT "CareerTrend_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerTrend" ADD CONSTRAINT "CareerTrend_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerRecommendation" ADD CONSTRAINT "CareerRecommendation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_formId_fkey" FOREIGN KEY ("formId") REFERENCES "LeadForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSession" ADD CONSTRAINT "AnalyticsSession_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelDailyRollup" ADD CONSTRAINT "FunnelDailyRollup_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "FunnelDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

