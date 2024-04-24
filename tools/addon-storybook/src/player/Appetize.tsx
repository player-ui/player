import React from "react";
import type { Flow } from "@player-ui/react";
import { compressToEncodedURIComponent } from "lz-string";

export interface AppetizeVersions {
  /** The iOS version to load */
  ios: string;
  /** The Android version to load */
  android: string;
}

export interface AppetizeProps {
  /** the platform to load */
  platform: "ios" | "android";

  /** the token for the build */
  token: string;

  /** the flow to load */
  flow: Flow;

  /** The versions to use for each platform */
  osVersions?: AppetizeVersions;

  /** The base URL to use for appetize */
  baseUrl?: string;
}

export const AppetizePhones = [
  // 'iphone4s',
  // 'iphone5s',
  // 'iphone6',
  // 'iphone6plus',
  // 'iphone6s',
  // 'iphone6splus',
  // 'iphone7',
  // 'iphone7plus',
  // 'iphone8',
  // 'iphone8plus',
  // 'iphonex',
  "iphonexs",
  // 'iphonexsmax',
  // 'iphone11pro',
  // 'iphone11promax',
  // 'ipadair',
  // 'ipadair2'
] as const;

export type AppetizePhone = (typeof AppetizePhones)[number];

const DEVICE_HEIGHT: Record<AppetizePhone, number> = {
  iphonexs: 845,
};

interface AppetizeParams {
  /** if the device should auto-start */
  autoplay: boolean;
  /** the device type */
  device: AppetizePhone;
  /** color */
  deviceColor: "black" | "white";

  /** render scale */
  scale: number;

  /** The operating system version to use */
  osVersion: string;

  /** other stuff to pass */
  params: string;
}

/** Create the url w/ params */
export const toAppetizeUrl = (
  baseUrl: string,
  key: string,
  params: AppetizeParams,
) =>
  `https://${baseUrl}/embed/${key}?${Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&")}`;

/** A component to render something using appetize */
export const Appetize = (props: AppetizeProps) => {
  const device: AppetizePhone = "iphonexs";
  const height = DEVICE_HEIGHT[device];

  const defaultVersions: AppetizeVersions = {
    ios: "13.7",
    android: "8.1",
  };

  const {
    baseUrl = "appetize.io",
    token,
    flow,
    osVersions = defaultVersions,
    platform,
  } = props;

  const osVersion = osVersions[platform];

  return (
    <iframe
      title="native app"
      style={{ height: `${height}px`, border: "none", width: "100%" }}
      src={toAppetizeUrl(baseUrl, token, {
        autoplay: true,
        device: "iphonexs",
        deviceColor: "black",
        scale: 100,
        osVersion,
        params: encodeURIComponent(
          JSON.stringify({
            json: compressToEncodedURIComponent(JSON.stringify(flow)),
          }),
        ),
      })}
    />
  );
};
