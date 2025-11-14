// components/ui/Modal.tsx
"use client";

import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  createFocusManager, 
  trapFocus, 
  generateFocusRingClasses, 
  generateAriaAttributes,
  ACCESSIBILITY 
} from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  // Accessibility props
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  initialFocus?: React.RefObject<HTMLElement>;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  initialFocus,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const focusManager = useRef(createFocusManager());

  const sizeClasses = {
    sm: 'max-w-sm w-full mx-4',
    md: 'max-w-md w-full mx-4',
    lg: 'max-w-lg w-full mx-4',
    xl: 'max-w-xl w-full mx-4',
    full: 'max-w-full mx-4',
  };

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      focusManager.current.saveFocus();
      
      // Focus the modal or initial focus element
      setTimeout(() => {
        if (initialFocus?.current) {
          initialFocus.current.focus();
        } else {
          modalRef.current?.focus();
        }
      }, 0);
      
      // Prevent body scroll and add modal class
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      // Restore body scroll and remove modal class
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
      
      // Restore focus
      focusManager.current.restoreFocus();
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, initialFocus]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (modalRef.current) {
      trapFocus(modalRef.current, event as any);
    }
  };

  if (!isOpen) return null;

  // Generate ARIA attributes
  const ariaAttributes = generateAriaAttributes({
    label: ariaLabel,
    labelledBy: ariaLabelledBy || (title ? 'modal-title' : undefined),
    describedBy: ariaDescribedBy,
    role: 'dialog',
  });

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleOverlayClick}
      aria-modal="true"
      {...ariaAttributes}
    >
      <div
        ref={modalRef}
        className={`
          relative ${sizeClasses[size]} max-h-[90vh] overflow-auto
          bg-white rounded-lg shadow-xl transform transition-all duration-200
          animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2
          ${generateFocusRingClasses()}
          ${className}
        `}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`
                  p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                  rounded-md transition-colors min-h-[44px] min-w-[44px]
                  ${generateFocusRingClasses()}
                `}
                aria-label={ACCESSIBILITY.ariaLabels.close}
                type="button"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );

  // Render modal in portal to avoid z-index issues
  return createPortal(modalContent, document.body);
}

// Modal sub-components for better composition
export function ModalHeader({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function ModalFooter({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`border-t border-gray-200 pt-4 mt-4 flex justify-end space-x-3 ${className}`}>
      {children}
    </div>
  );
}