// components/demo/UIShowcase.tsx
"use client";

import { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Modal,
  Badge,
  StatusBadge,
  Alert,
  SuccessAlert,
  ErrorAlert,
  Tooltip,
  InfoTooltip
} from '@/components/ui';

export default function UIShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Enhanced UI Components Showcase
        </h1>

        {/* Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="default" hover>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>
                  A simple card with hover effect
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  This is the content of the card. It can contain any React elements.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" size="md">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>
                  Card with shadow elevation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <StatusBadge status="active" />
                  <StatusBadge status="pending" />
                  <StatusBadge status="rejected" />
                </div>
              </CardContent>
            </Card>

            <Card variant="outlined" onClick={() => setIsModalOpen(true)}>
              <CardHeader>
                <CardTitle>Clickable Card</CardTitle>
                <CardDescription>
                  Click to open modal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  This card is clickable and will open a modal.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Badges Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Badges</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Badge variant="primary" size="sm" rounded>Small</Badge>
              <Badge variant="secondary" size="md" rounded>Medium</Badge>
              <Badge variant="success" size="lg" rounded>Large</Badge>
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge variant="warning" removable onRemove={() => alert('Badge removed!')}>
                Removable
              </Badge>
              <StatusBadge status="approved" />
              <StatusBadge status="pending" />
              <StatusBadge status="rejected" />
            </div>
          </div>
        </section>

        {/* Alerts Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Alerts</h2>
          <div className="space-y-4">
            <SuccessAlert dismissible onDismiss={() => console.log('Success alert dismissed')}>
              Your registration has been completed successfully!
            </SuccessAlert>

            <ErrorAlert>
              There was an error processing your request. Please try again.
            </ErrorAlert>

            <Alert variant="warning" title="Important Notice">
              Please review your information before submitting the form.
            </Alert>

            <Alert variant="info" icon={false}>
              This is an informational message without an icon.
            </Alert>
          </div>
        </section>

        {/* Tooltips Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Tooltips</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Tooltip content="This is a helpful tooltip" position="top">
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Hover me (top)
                </button>
              </Tooltip>

              <Tooltip content="Bottom positioned tooltip" position="bottom">
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Hover me (bottom)
                </button>
              </Tooltip>

              <div className="flex items-center space-x-2">
                <span>Need help?</span>
                <InfoTooltip content="This is additional information that helps users understand the feature better." />
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Elements */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Interactive Elements</h2>
          <div className="space-y-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] transition-colors"
            >
              Open Modal
            </button>
          </div>
        </section>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              This is an example modal using the new Modal component. It includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Keyboard navigation support</li>
              <li>Focus trapping</li>
              <li>Backdrop click to close</li>
              <li>Escape key to close</li>
              <li>Accessibility features</li>
            </ul>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-[#e4007c] text-white rounded hover:bg-[#c6006b]"
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}