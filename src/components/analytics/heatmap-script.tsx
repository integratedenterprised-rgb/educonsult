/**
 * Heatmap / third-party tag injection.
 *
 * Server component — renders `<Script>` tags based on the admin-selected
 * provider in `AnalyticsConfig`. Adding a provider = add a branch here and
 * a field on the config row.
 *
 * Loaded inside the document `<head>` of the public layout. Admin pages do
 * NOT mount this — heatmaps on /admin would record sensitive data.
 */
import Script from "next/script";
import { getPublicAnalyticsConfig } from "@/server/analytics/config.service";

export async function HeatmapScript() {
  const c = await getPublicAnalyticsConfig();
  return (
    <>
      {c.ga4MeasurementId && <Ga4 id={c.ga4MeasurementId} />}
      {c.gtmContainerId && <Gtm id={c.gtmContainerId} />}
      {c.metaPixelId && <MetaPixel id={c.metaPixelId} />}
      {c.heatmapProvider === "CLARITY" && c.clarityProjectId && (
        <Clarity projectId={c.clarityProjectId} />
      )}
      {c.heatmapProvider === "HOTJAR" && c.hotjarSiteId && <Hotjar siteId={c.hotjarSiteId} />}
      {c.heatmapProvider === "POSTHOG" && c.posthogApiKey && (
        <PostHog apiKey={c.posthogApiKey} host={c.posthogHost ?? "https://app.posthog.com"} />
      )}
      {c.heatmapProvider === "FULLSTORY" && c.fullstoryOrgId && (
        <FullStory orgId={c.fullstoryOrgId} />
      )}
    </>
  );
}

function Ga4({ id }: { id: string }) {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${id}', { anonymize_ip: true });
      `}</Script>
    </>
  );
}

function Gtm({ id }: { id: string }) {
  return (
    <Script id="gtm-init" strategy="afterInteractive">{`
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');
    `}</Script>
  );
}

function MetaPixel({ id }: { id: string }) {
  return (
    <Script id="meta-pixel" strategy="afterInteractive">{`
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${id}');
      fbq('track', 'PageView');
    `}</Script>
  );
}

function Clarity({ projectId }: { projectId: string }) {
  return (
    <Script id="clarity" strategy="afterInteractive">{`
      (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script','${projectId}');
    `}</Script>
  );
}

function Hotjar({ siteId }: { siteId: string }) {
  const snippet =
    "(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};" +
    `h._hjSettings={hjid:${Number(siteId) || 0},hjsv:6};` +
    "a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;" +
    "r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);" +
    "})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');";
  return (
    <Script id="hotjar" strategy="afterInteractive">
      {snippet}
    </Script>
  );
}

function PostHog({ apiKey, host }: { apiKey: string; host: string }) {
  return (
    <Script id="posthog" strategy="afterInteractive">{`
      !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      posthog.init('${apiKey}', { api_host: '${host}', capture_pageview: false });
    `}</Script>
  );
}

function FullStory({ orgId }: { orgId: string }) {
  return (
    <Script id="fullstory" strategy="afterInteractive">{`
      window['_fs_host'] = 'fullstory.com';window['_fs_script'] = 'edge.fullstory.com/s/fs.js';window['_fs_org'] = '${orgId}';window['_fs_namespace'] = 'FS';(function(m,n,e,t,l,o,g,y){if(e in m){if(m.console&&m.console.log){m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].');}return;}g=m[e]=function(a,b,s){g.q?g.q.push([a,b,s]):g._api(a,b,s);};g.q=[];o=n.createElement(t);o.async=1;o.crossOrigin='anonymous';o.src='https://'+_fs_script;y=n.getElementsByTagName(t)[0];y.parentNode.insertBefore(o,y);})(window,document,window['_fs_namespace'],'script');
    `}</Script>
  );
}
