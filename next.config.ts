import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 서버 번들에서 네이티브 의존성을 외부 패키지로 두어 Server Action 런타임과 맞춥니다.
   * `pdf-parse`는 번들 시 worker 경로가 깨질 수 있어 외부화 (Next 15+는 이 필드가
   * 예전 `experimental.serverComponentsExternalPackages` 역할을 합니다).
   */
  serverExternalPackages: ["@supabase/supabase-js", "pdf-parse"],
  /**
   * Server Actions 멀티파트 본문 한도(라벨 다중 업로드).
   * Next.js 16.2 런타임은 여전히 `experimental.serverActions.bodySizeLimit`만 적용합니다.
   * (최상위 `serverActions` 키는 현재 버전 스키마에서 거부됨.)
   */
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
