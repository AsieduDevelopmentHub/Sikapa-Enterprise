"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBagShopping,
  faBars,
  faCartShopping,
  faChevronLeft,
  faClipboardList,
  faFilter,
  faHeart as faHeartSolid,
  faHouse,
  faMagnifyingGlass,
  faStore,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";

const sz = "h-[1.125rem] w-[1.125rem]";

type IconProps = { className?: string };

/** Font Awesome 6 solid — matches mockup toolbar / bottom nav. */
export function FaBars({ className = "" }: IconProps) {
  return <FontAwesomeIcon icon={faBars} className={`${sz} ${className}`} />;
}

export function FaSearch({ className = "" }: IconProps) {
  return <FontAwesomeIcon icon={faMagnifyingGlass} className={`${sz} ${className}`} />;
}

export function FaChevronLeft({ className = "" }: IconProps) {
  return <FontAwesomeIcon icon={faChevronLeft} className={`${sz} ${className}`} />;
}

export function FaHeartOutline({ className = "" }: IconProps) {
  return <FontAwesomeIcon icon={faHeartRegular} className={`${sz} ${className}`} />;
}

export function FaHeartSolid({ className = "" }: IconProps) {
  return <FontAwesomeIcon icon={faHeartSolid} className={`${sz} ${className}`} />;
}

export function FaBag({ className = "" }: IconProps) {
  return <FontAwesomeIcon icon={faBagShopping} className={`${sz} ${className}`} />;
}

export function FaHome({ className = "" }: IconProps) {
  return <FontAwesomeIcon icon={faHouse} className={`h-5 w-5 ${className}`} />;
}

export function FaShop({ className = "" }: IconProps) {
  return <FontAwesomeIcon icon={faStore} className={`h-5 w-5 ${className}`} />;
}

export function FaCart({ className = "" }: IconProps) {
  return <FontAwesomeIcon icon={faCartShopping} className={`h-5 w-5 ${className}`} />;
}

export function FaOrders({ className = "" }: IconProps) {
  return <FontAwesomeIcon icon={faClipboardList} className={`h-5 w-5 ${className}`} />;
}

export function FaAccount({ className = "" }: IconProps) {
  return <FontAwesomeIcon icon={faUser} className={`h-5 w-5 ${className}`} />;
}

export function FaFilterIcon({ className = "" }: IconProps) {
  return <FontAwesomeIcon icon={faFilter} className={`h-4 w-4 ${className}`} />;
}
