import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";
import { useState, memo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Star } from "lucide-react";
import { getDeliveryEstimateLabel } from "@/app/domain/productFulfillment";
import type { ProductFulfillment } from "@/app/types";
interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  image: string;
  logo: string;
  price: number;
  fulfillment: ProductFulfillment;
  popular?: boolean;
  enableAnimations?: boolean;
  /** Optional: trust layer. Show rating when provided. */
  rating?: number;
  reviewsCount?: number;
}

function ProductCardComponent({
  id: _id,
  slug,
  name,
  image,
  logo: _logo,
  price,
  fulfillment,
  popular = false,
  enableAnimations = true,
  rating,
  reviewsCount,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  const containerVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const imageVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 1.1,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  };

  const contentVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
        mass: 0.6,
      },
    },
  };

  const badgeVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 450,
        damping: 25,
      },
    },
  };

  const getBadgeVariant = () => {
    if (fulfillment.estimate === "instant") return "default";
    if (fulfillment.estimate !== "manual-review") return "secondary";
    return "outline";
  };

  return (
    <motion.div
      className="w-full h-full"
      initial={shouldAnimate ? "hidden" : "visible"}
      animate="visible"
      variants={shouldAnimate ? containerVariants : {}}
    >
      <Link to={`/product/${slug}`} className="block h-full">
        <motion.div
          className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-out h-full flex flex-col group"
          variants={shouldAnimate ? contentVariants : {}}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          {/* Top Image Section */}
          <motion.div
            className="relative bg-muted border-b border-border/50"
            variants={shouldAnimate ? imageVariants : {}}
          >
            <div className="relative aspect-video overflow-hidden">
              <motion.img
                src={image}
                alt={name}
                className="w-full h-full object-cover"
                animate={{
                  scale: isHovered ? 1.05 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  duration: 0.3,
                }}
              />

              {/* Popular Badge */}
              {popular && (
                <div className="absolute top-2 left-2">
                  <Badge
                    variant="secondary"
                    className="text-xs shadow-lg bg-primary text-primary-foreground"
                  >
                    Популярное
                  </Badge>
                </div>
              )}

              {/* Blur Overlay with Button on Hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                        delay: 0.1,
                      }}
                    >
                      <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                        size="lg"
                      >
                        Открыть
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Bottom Content Section */}
          <motion.div
            className="p-4 flex-1 flex flex-col"
            variants={shouldAnimate ? contentVariants : {}}
          >
            {/* Title */}
            <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
              {name}
            </h3>

            {/* Optional rating (trust layer) */}
            {(rating != null || (reviewsCount != null && reviewsCount > 0)) && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                {rating != null && (
                  <>
                    <Star className="h-4 w-4 fill-warning text-warning shrink-0" />
                    <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                  </>
                )}
                {reviewsCount != null && reviewsCount > 0 && (
                  <span>({reviewsCount})</span>
                )}
              </div>
            )}

            {/* Price and Badge */}
            <div className="flex items-center justify-between mt-auto">
              <motion.span
                className="text-base font-bold text-primary"
                variants={shouldAnimate ? badgeVariants : {}}
              >
                от {price} ₽
              </motion.span>
              <motion.div variants={shouldAnimate ? badgeVariants : {}}>
                <Badge variant={getBadgeVariant()} className="text-xs">
                  {getDeliveryEstimateLabel(fulfillment.estimate)}
                </Badge>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Memoize ProductCard to prevent unnecessary re-renders
export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.id === nextProps.id &&
    prevProps.price === nextProps.price &&
    prevProps.popular === nextProps.popular &&
    prevProps.fulfillment.type === nextProps.fulfillment.type &&
    prevProps.fulfillment.channel === nextProps.fulfillment.channel &&
    prevProps.fulfillment.estimate === nextProps.fulfillment.estimate &&
    prevProps.name === nextProps.name &&
    prevProps.slug === nextProps.slug &&
    prevProps.rating === nextProps.rating &&
    prevProps.reviewsCount === nextProps.reviewsCount
  );
});
