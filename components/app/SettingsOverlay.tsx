'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/primitives/Icon';
import Logo from '@/components/primitives/Logo';
import ProfileTab       from './settings/ProfileTab';
import SecurityTab      from './settings/SecurityTab';
import NotificationsTab from './settings/NotificationsTab';
import AppearanceTab    from './settings/AppearanceTab';
import GeneralTab       from './settings/GeneralTab';
import MembersTab       from './settings/MembersTab';
import BillingTab       from './settings/BillingTab';
import IntegrationsTab  from './settings/IntegrationsTab';
import PermissionsTab   from './settings/PermissionsTab';

const NAV_GROUPS = [
  {
    label: 'WORKSPACE',
    items: [
      { id: 'General',      icon: 'settings' },
      { id: 'Members',      icon: 'users'    },
      { id: 'Billing',      icon: 'card'     },
      { id: 'Integrations', icon: 'zap'      },
      { id: 'Permissions',  icon: 'shield'   },
    ],
  },
  {
    label: 'YOUR ACCOUNT',
    items: [
      { id: 'Profile',       icon: 'at'      },
      { id: 'Security',      icon: 'shield'  },
      { id: 'Notifications', icon: 'bell'    },
      { id: 'Appearance',    icon: 'sliders' },
    ],
  },
];

function renderTab(tab: string) {
  switch (tab) {
    case 'Profile':       return <ProfileTab />;
    case 'Security':      return <SecurityTab />;
    case 'Notifications': return <NotificationsTab />;
    case 'Appearance':    return <AppearanceTab />;
    case 'General':       return <GeneralTab />;
    case 'Members':       return <MembersTab />;
    case 'Billing':       return <BillingTab />;
    case 'Integrations':  return <IntegrationsTab />;
    case 'Permissions':   return <PermissionsTab />;
    default:              return null;
  }
}

interface Props {
  onClose: () => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function SettingsOverlay({ onClose, initialTab = 'Profile', onTabChange }: Props) {
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleTabChange(t: string) {
    setTab(t);
    onTabChange?.(t);
  }

  return (
    <div className="fixed inset-0 z-[105] bg-bg anim-fade flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-divider flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-muted">/</span>
          <span className="text-[14px] font-medium text-ink">Settings</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar nav */}
        <nav className="w-[220px] border-r border-divider p-3 shrink-0 overflow-y-auto">
          <button
            onClick={onClose}
            className="w-full flex items-center gap-2.5 px-3 h-9 rounded-md text-[14px] text-sub hover:bg-elevated hover:text-ink transition mb-4"
          >
            <Icon name="arrowleft" size={16} /> Back to workspace
          </button>

          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-5">
              <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-muted">{group.label}</div>
              {group.items.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleTabChange(n.id)}
                  className={`w-full flex items-center gap-2.5 px-3 h-9 rounded-md text-[14px] transition ${
                    tab === n.id ? 'bg-elevated text-ink' : 'text-sub hover:bg-elevated hover:text-ink'
                  }`}
                >
                  <Icon name={n.icon} size={16} /> {n.id}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[720px] mx-auto px-8 py-8">
            {renderTab(tab)}
          </div>
        </div>
      </div>
    </div>
  );
}
