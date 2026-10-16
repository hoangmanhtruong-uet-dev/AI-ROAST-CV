'use client';

import React from 'react';
import Navbar, { NavbarProps } from '@/components/landing/Navbar';

export type HeaderProps = NavbarProps;

/**
 * Backwards-compatible Header alias/wrapper delegating to Floating Pill Navbar.
 */
export default function Header(props: HeaderProps) {
  return <Navbar {...props} />;
}
