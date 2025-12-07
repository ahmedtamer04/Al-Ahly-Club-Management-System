'use client';

import Link from 'next/link';

/**
 * Breadcrumb Component - Shows navigation path
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items [{label, href}]
 * 
 * Example:
 * <Breadcrumb items={[
 *   {label: 'Dashboard', href: '/student/dashboard'},
 *   {label: 'Events', href: '/student/events'},
 *   {label: 'Event Details'}
 * ]} />
 */
export default function Breadcrumb({ items = [] }) {
  if (!items || items.length === 0) {
    return null;
  }
  
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="breadcrumb-item">
            {!isLast && item.href ? (
              <>
                <Link href={item.href} className="breadcrumb-link">
                  {item.label}
                </Link>
                <span className="breadcrumb-separator" aria-hidden="true">/</span>
              </>
            ) : (
              <span className="breadcrumb-current" aria-current="page">
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
