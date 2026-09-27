import AutorenewIcon from "@mui/icons-material/Autorenew";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import SentimentSatisfiedAltOutlinedIcon from "@mui/icons-material/SentimentSatisfiedAltOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import {
  lavender,
  mint,
  peach,
  sky,
} from "./toyNestTokens";
import type { CategoryCardData, ProductCardData, TrustCardData } from "./types";

export const navItems = [
  "Toys",
  "Gifts",
  "Shop by Age",
  "Birthday",
  "Educational",
  "New Arrivals",
  "Offers",
];

export const categories: CategoryCardData[] = [
  { title: "Soft Toys", icon: "🧸", color: peach },
  { title: "Remote Cars", icon: "🏎️", color: sky },
  { title: "Educational", icon: "🧮", color: mint },
  { title: "Arts & Crafts", icon: "🎨", color: lavender },
  { title: "Building Blocks", icon: "🧱", color: peach },
  { title: "Personalized Gifts", icon: "🎁", color: sky },
  { title: "Birthday Gifts", icon: "🎈", color: lavender },
  { title: "Outdoor Play", icon: "🛝", color: mint },
];

export const trendingProducts: ProductCardData[] = [
  {
    title: "Wooden Stacking Toy",
    description: "Safe, durable & colorful rings",
    icon: "🪆",
    imageColor: peach,
    originalPrice: "₹1,299",
    price: "₹899",
    discount: "31% OFF",
  },
  {
    title: "Teddy Bear Gift Set",
    description: "Soft teddy with mug & gift box",
    icon: "🧸",
    imageColor: lavender,
    originalPrice: "₹1,299",
    price: "₹899",
    discount: "31% OFF",
  },
  {
    title: "Remote Control Car",
    description: "High-speed stunts & 360° rotation",
    icon: "🏎️",
    imageColor: sky,
    originalPrice: "₹1,299",
    price: "₹899",
    discount: "31% OFF",
  },
  {
    title: "Kids Art Kit",
    description: "Creative set for bright moments",
    icon: "🎨",
    imageColor: mint,
    originalPrice: "₹1,299",
    price: "₹899",
    discount: "31% OFF",
  },
];

export const recommendedProducts: ProductCardData[] = [
  {
    title: "Building Blocks Set",
    description: "Build, learn & imagine possibilities",
    icon: "🧱",
    imageColor: peach,
    originalPrice: "₹1,299",
    price: "₹899",
    discount: "31% OFF",
  },
  {
    title: "Personalized Name Mug",
    description: "Custom mug with name of your choice",
    icon: "☕",
    imageColor: "#fbf5ec",
    originalPrice: "₹1,299",
    price: "₹899",
    discount: "31% OFF",
  },
  {
    title: "Plush Bunny Rabbit",
    description: "Super soft cuddle buddy for kids",
    icon: "🐰",
    imageColor: lavender,
    originalPrice: "₹1,299",
    price: "₹899",
    discount: "31% OFF",
  },
  {
    title: "Kids Camera",
    description: "Capture every little adventure",
    icon: "📷",
    imageColor: mint,
    originalPrice: "₹1,299",
    price: "₹899",
    discount: "31% OFF",
  },
];

export const trustCards: TrustCardData[] = [
  {
    title: "Genuine Products",
    detail: "100% authentic toys & gifts",
    color: mint,
    icon: <VerifiedOutlinedIcon />,
  },
  {
    title: "Safe for Kids",
    detail: "Non-toxic & child-safe",
    color: sky,
    icon: <SentimentSatisfiedAltOutlinedIcon />,
  },
  {
    title: "Easy Returns",
    detail: "Hassle-free 7-day returns",
    color: peach,
    icon: <AutorenewIcon />,
  },
  {
    title: "Secure Payments",
    detail: "100% secure checkout",
    color: lavender,
    icon: <CreditCardOutlinedIcon />,
  },
];
