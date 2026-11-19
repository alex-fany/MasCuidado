import CustomIcon from './CustomIcon';
import React from 'react';

export const CloseIcon = () => <CustomIcon name="ICON-016" width={32} height={32} />;

export const CheckIcon = () => <CustomIcon name="ICON-017" width={24} height={24} />;

export const ClockIcon = () => <CustomIcon name="ICON-008" width={28} height={28} />;

export const SettingsIcon = () => <CustomIcon name="ICON-006" width={34} height={34} />;

export const HomeIcon = () => <CustomIcon name="ICON-001" width={42} height={42} />;

export const TrophyIcon = () => <CustomIcon name="ICON-002" width={28} height={28} />;

export const MapIcon = () => <CustomIcon name="ICON-003" width={28} height={28} />;

export const MapPinIcon = () => (
  <svg width="28" height="28" viewBox="0 0 100 100">
    <circle cx="54" cy="54" r="35" opacity=".2" fill="#3aaba5"></circle>
    <path d="M50,10c-15,0-28,12-28,28c0,20,28,52,28,52s28-32,28-52C78,22,65,10,50,10z" fill="white" stroke="#1a5d5a" strokeWidth="3"></path>
    <circle cx="50" cy="38" r="12" fill="#2d9b96" stroke="#1a5d5a" strokeWidth="3"></circle>
  </svg>
);

export const CalendarIcon = () => <CustomIcon name="ICON-004" width={28} height={28} />;

export const GoogleCalendarBrandIcon = () => <CustomIcon name="ICON-013" width={24} height={24} />;

export const UsersIcon = () => <CustomIcon name="ICON-005" width={28} height={28} />;

export const HangerIcon = () => (
  <svg width="32" height="32" viewBox="0 0 100 100">
    <path d="M50,5 L50,15 M30,30 L70,30 L85,45 L85,85 C85,90 80,95 75,95 L25,95 C20,95 15,90 15,85 L15,45 L30,30" fill="white" opacity=".35" transform="translate(3, 3)"></path>
    <path d="M50,2 L50,12 M30,27 L70,27 L85,42 L85,82 C85,87 80,92 75,92 L25,92 C20,92 15,87 15,82 L15,42 L30,27" fill="white"></path>
    <path d="M50,12 C55,12 58,15 58,20 C58,25 53,27 50,27 C47,27 42,25 42,20" fill="none" stroke="#1a5d5a" strokeWidth="4" strokeLinecap="round"></path>
    <path d="M30,27 L20,42 L20,55 L30,50 L30,85 L70,85 L70,50 L80,55 L80,42 L70,27 Z" fill="#2d9b96" stroke="#1a5d5a" strokeWidth="3" strokeLinejoin="round"></path>
    <circle cx="50" cy="35" r="3" fill="#e6fcfb" stroke="#1a5d5a" strokeWidth="1.5"></circle>
  </svg>
);

export const BellIcon = () => <CustomIcon name="ICON-007" width={32} height={32} />;

export const FoodBowlIcon = () => <CustomIcon name="ICON-009" width={32} height={32} />;

export const WaterDropIcon = () => <CustomIcon name="ICON-010" width={24} height={24} />;

export const LogoutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 100 100">
    <path d="M30,20H20c-5,0-10,5-10,10v40c0,5,5,10,10,10h10" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"></path>
    <path d="M50,50h40M90,50l-15-15M90,50l-15,15" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

export const TrashIcon = () => <CustomIcon name="ICON-018" width={24} height={24} />;

export const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d9b96" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export const ClinicFavoriteIcon = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 100 100">
    <path d="M19.5,98.001c-1.022,0-2.044-0.246-2.955-0.711C14.361,96.179,13,93.959,13,91.5v-75 C13,10.71,17.71,6,23.5,6h47C76.29,6,81,10.71,81,16.5v9.471l2.68,8.246h9.699c2.823,0,5.308,1.804,6.182,4.489 c0.871,2.691-0.078,5.61-2.36,7.27l-7.848,5.701l2.997,9.225c0.871,2.689-0.078,5.608-2.36,7.268 c-1.122,0.812-2.441,1.241-3.821,1.241s-2.699-0.429-3.816-1.238L81,67.19V91.5c0,3.478-3.003,6.5-5.733,6.5 c-1.387,0-2.712-0.432-3.831-1.249L47.767,79.537l-24.445,17.22C22.215,97.567,20.889,98.001,19.5,98.001z" opacity=".35" fill="#3aaba5"></path>
    <path fill="white" d="M17.5,96.001c-1.022,0-2.044-0.246-2.955-0.711C12.361,94.179,11,91.959,11,89.5v-75 C11,8.71,15.71,4,21.5,4h47C74.29,4,79,8.71,79,14.5v9.471l2.68,8.246h9.699c2.823,0,5.308,1.804,6.182,4.489 c0.871,2.691-0.078,5.61-2.36,7.27l-7.848,5.701l2.997,9.225c0.871,2.689-0.078,5.608-2.36,7.268 c-1.122,0.812-2.441,1.241-3.821,1.241s-2.699-0.429-3.816-1.238L79,65.19V89.5c0,2.459-1.361,4.679-3.552,5.793 C74.54,95.756,73.521,96,72.5,96c-1.387,0-2.712-0.432-3.831-1.249L45,77.537l-23.678,17.22 C20.215,95.567,18.889,96.001,17.5,96.001z"></path>
    <path fill={filled ? "#2d9b96" : "#f2f2f2"} d="M21.5,10.5h47c2.209,0,4,1.791,4,4v75L45,69.5l-27.5,20v-75C17.5,12.291,19.291,10.5,21.5,10.5z"></path>
    <path fill="#fbbf24" d="M73.382,51.219c-0.263-0.19-0.572-0.286-0.882-0.286s-0.619,0.096-0.882,0.286l-7.933,5.765 l3.03-9.326c0.2-0.618-0.02-1.296-0.545-1.678l-7.933-5.763h9.805c0.649,0,1.226-0.418,1.427-1.036l3.03-9.327l3.03,9.327 c0.201,0.618,0.777,1.036,1.427,1.036h9.805l-7.933,5.763c-0.525,0.382-0.745,1.06-0.545,1.678l3.03,9.326L73.382,51.219z"></path>
    <path fill="none" stroke="#1a5d5a" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="3" d="M91.379,38.716H76.957 L72.5,25V14.5c0-2.209-1.791-4-4-4h-47c-2.209,0-4,1.791-4,4v75l27.5-20l27.5,20V52.433l11.668,8.477l-4.457-13.716L91.379,38.716z"></path>
  </svg>
);

export const BookmarkIcon = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 100 100">
    <path d="M24.501,98.001c-1.021,0-2.042-0.245-2.952-0.709C19.361,96.179,18,93.959,18,91.5v-75 C18,10.701,22.701,6,28.5,6h47C81.299,6,86,10.701,86,16.5v75.501c0,3.314-2.686,6-5.999,6h0c-1.299,0-2.562-0.421-3.601-1.2L50,77 l3.011,1.949L28.322,96.757C27.215,97.567,25.889,98.001,24.501,98.001z" opacity=".35" fill="#3aaba5"></path>
    <path fill="white" d="M22.501,96.001c-1.021,0-2.042-0.245-2.952-0.709C17.361,94.179,16,91.959,16,89.5v-75 C16,8.71,26.5,4,26.5,4h47C79.29,4,84,8.71,84,14.5v75c0,2.459-1.361,4.679-3.552,5.793C79.54,95.756,78.521,96,77.5,96	c-1.387,0-2.712-0.432-3.831-1.249L50,77.537l-23.678,17.22C25.215,95.567,23.889,96.001,22.501,96.001z"></path>
    <path fill={filled ? "#2d9b96" : "#f2f2f2"} d="M26.5,10.5h47c2.209,0,4,1.791,4,4v75L50,69.5l-27.5,20v-75C22.5,12.291,24.291,10.5,26.5,10.5z"></path>
    <path fill="none" stroke="#1a5d5a" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="3" d="M26.5,10.5h47 c2.209,0,4,1.791,4,4v75L50,69.5l-27.5,20v-75C22.5,12.291,24.291,10.5,26.5,10.5z"></path>
  </svg>
);

export const StarIcon = ({ filled }) => <CustomIcon name="ICON-014" width={20} height={20} muted={!filled} />;

export const ShieldIcon = () => <CustomIcon name="ICON-015" width={24} height={24} />;

export const GoogleCalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2d9b96" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
    <path d="M8 14h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M16 14h.01"></path>
    <path d="M8 18h.01"></path>
    <path d="M12 18h.01"></path>
    <path d="M16 18h.01"></path>
  </svg>
);

export const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.7 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

