import Image from "next/image"
import { cn } from "@/lib/utils"

type LoopleLogoProps = {
  className?: string
  size?: number
}

export function LoopleLogo({ className, size = 28 }: LoopleLogoProps) {
  return (
    <Image
      src="/logo-circle.png"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      priority
    />
  )
}
