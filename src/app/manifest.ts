import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Luna AI",
    short_name: "Luna",
    description: "Osobista asystentka AI z pamięcią, bazą wiedzy i powiadomieniami.",
    display: "standalone",
    start_url: "/chat",
    theme_color: "#6366f1",
    background_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
