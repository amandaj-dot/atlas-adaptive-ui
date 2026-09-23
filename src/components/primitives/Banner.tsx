import type { z } from "zod";
import type { bannerSchema } from "../registry/schemas";
import "./Banner.css";

type BannerProps = z.infer<typeof bannerSchema>;

const toneClass: Record<BannerProps["tone"], string> = {
  info: "banner--info",
  alert: "banner--alert",
  success: "banner--success",
};

export function Banner({ tone, title, message }: BannerProps) {
  return (
    <div className={`banner ${toneClass[tone]}`} role="status">
      <p className="banner__title">{title}</p>
      <p className="banner__message">{message}</p>
    </div>
  );
}
