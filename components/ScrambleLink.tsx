"use client";

import type { ComponentProps } from "react";
import { MagneticLink } from "./MagneticLink";

type Props = Omit<ComponentProps<typeof MagneticLink>, "scramble">;

/** Magnetic link with hover character scramble enabled. */
export function ScrambleLink(props: Props) {
  return <MagneticLink {...props} scramble />;
}
