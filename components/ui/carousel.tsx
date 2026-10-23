'use client'

import * as React from 'react'
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from 'embla-carousel-react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: 'horizontal' | 'vertical'
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />')
  }

  return context
}

function Carousel({
  orientation = 'horizontal',
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === 'horizontal' ? 'x' : 'y',
    },
    plugins,
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        scrollNext()
      }
    },
    [scrollPrev, scrollNext],
  )

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on('reInit', onSelect)
    api.on('select', onSelect)

    return () => {
      api?.off('select', onSelect)
    }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation:
          orientation || (opts?.axis === 'y' ? 'vertical' : 'horizontal'),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<'div'>) {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div
      ref={carouselRef}
      className="overflow-hidden"
      data-slot="carousel-content"
    >
      <div
        className={cn(
          'flex',
          orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
          className,
        )}
        {...props}
      />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<'div'>) {
  const { orientation } = useCarousel()

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        'min-w-0 shrink-0 grow-0 basis-full',
        orientation === 'horizontal' ? 'pl-4' : 'pt-4',
        className,
      )}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  variant = 'outline',
  size = 'icon',
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        'absolute size-control-sm rounded-full',
        orientation === 'horizontal'
          ? 'top-1/2 -left-12 -translate-y-1/2'
          : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

function CarouselNext({
  className,
  variant = 'outline',
  size = 'icon',
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        'absolute size-control-sm rounded-full',
        orientation === 'horizontal'
          ? 'top-1/2 -right-12 -translate-y-1/2'
          : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}

/**
 * Dot pagination for the active Embla carousel. Prefer passing `count` when
 * the slide list is known up front so dots render on the first paint (and in
 * SSR); otherwise the count is read from the Embla API after init.
 *
 * Active page is a short muted pill (~3–4× a resting dot); inactive pages stay
 * as small muted dots — no brand/primary color.
 */
function CarouselDots({
  count: countProp,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  /** Known slide count. When omitted, reads from the Embla API after mount. */
  count?: number
}) {
  const { api } = useCarousel()
  const [selected, setSelected] = React.useState(0)
  const [apiCount, setApiCount] = React.useState(0)

  React.useEffect(() => {
    if (!api) return
    const sync = () => {
      setSelected(api.selectedScrollSnap())
      setApiCount(api.scrollSnapList().length)
    }
    sync()
    api.on('reInit', sync)
    api.on('select', sync)
    return () => {
      api.off('reInit', sync)
      api.off('select', sync)
    }
  }, [api])

  const count = countProp ?? apiCount
  if (count <= 1) return null

  return (
    <div
      role="tablist"
      aria-label="Carousel pagination"
      data-slot="carousel-dots"
      className={cn('flex items-center justify-center gap-1.5', className)}
      {...props}
    >
      {Array.from({ length: count }, (_, index) => {
        const isSelected = index === selected
        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              'h-1.5 rounded-full transition-[width,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'w-5 bg-muted-foreground/45'
                : 'w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40',
            )}
          />
        )
      })}
    </div>
  )
}

/**
 * Fades slides as they leave the carousel viewport. Honors
 * `prefers-reduced-motion` by keeping every slide fully opaque.
 *
 * Call with the Embla API from `setApi` (or from a child that uses
 * `useCarousel`). IntersectionObserver runs against the Embla viewport so
 * opacity tracks continuous scroll, not just snap points.
 */
function useCarouselSlideFade(
  api: CarouselApi | undefined,
  options?: { minOpacity?: number },
) {
  const minOpacity = options?.minOpacity ?? 0.35

  React.useEffect(() => {
    if (!api) return

    let observer: IntersectionObserver | null = null
    let observed: HTMLElement[] = []

    const teardown = () => {
      observer?.disconnect()
      observer = null
      for (const slide of observed) {
        slide.style.opacity = ''
        slide.style.transition = ''
      }
      observed = []
    }

    const setup = () => {
      teardown()

      const root = api.rootNode()
      const slides = api.slideNodes()
      if (!root || slides.length === 0) return

      observed = slides

      const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reduceMotion) {
        for (const slide of slides) {
          slide.style.opacity = '1'
          slide.style.transition = ''
        }
        return
      }

      for (const slide of slides) {
        slide.style.transition = 'opacity 150ms ease-out'
      }

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const el = entry.target as HTMLElement
            el.style.opacity = String(
              minOpacity + entry.intersectionRatio * (1 - minOpacity),
            )
          }
        },
        {
          root,
          threshold: Array.from({ length: 21 }, (_, i) => i / 20),
        },
      )

      for (const slide of slides) observer.observe(slide)
    }

    setup()
    api.on('reInit', setup)

    return () => {
      api.off('reInit', setup)
      teardown()
    }
  }, [api, minOpacity])
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
  useCarousel,
  useCarouselSlideFade,
}
