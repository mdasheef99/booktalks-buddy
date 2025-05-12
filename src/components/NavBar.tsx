
import React from "react";
import { useLocation } from "react-router-dom";
import BookConnectHeader from "./BookConnectHeader";
import BookClubHeader from "./bookclubs/BookClubHeader";

const NavBar = () => {
  const location = useLocation();
  const isBookClubRoute = location.pathname.startsWith('/book-club');

  // Use BookClubHeader for book club routes, BookConnectHeader for everything else
  return isBookClubRoute ? <BookClubHeader /> : <BookConnectHeader />;
};

export default NavBar;
