import React, { useState } from "react";
import { Tab } from "@headlessui/react";
import { ClientPortalMessages } from './components/ClientPortalMessages.jsx';
import { TeamChat } from './components/TeamChat.jsx';
import { EmailIntegration } from './components/EmailIntegration.jsx';
import { SMSIntegration } from './components/SMSIntegration.jsx';
import { InternalNotes } from './components/InternalNotes.jsx';

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const CommunicationHub = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { name: "Team Chat", component: TeamChat },
    { name: "Email", component: EmailIntegration },
    { name: "SMS", component: SMSIntegration },
    { name: "Internal Notes", component: InternalNotes },
    { name: "Client Messages", component: ClientPortalMessages },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Communication Hub
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all your communications in one place - team chat, emails,
            SMS, and client messages.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                    "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                    selected
                      ? "bg-white text-blue-700 shadow"
                      : "text-blue-100 hover:bg-white/[0.12] hover:text-white",
                  )
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-2">
            {tabs.map((tab, idx) => (
              <Tab.Panel
                key={idx}
                className={classNames(
                  "rounded-xl bg-white p-3",
                  "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                )}
              >
                <tab.component />
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export { CommunicationHub };
