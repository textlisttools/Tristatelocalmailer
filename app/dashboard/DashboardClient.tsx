"use client";

import { EnableNotificationsButton } from "@/components/EnableNotificationsButton";
import type { AdSlot, Lead, Scan } from "@/types/database";

type DashboardClientProps = {
  adSlots: AdSlot[];
  scans: Scan[];
  leads: Lead[];
};

export function DashboardClient({ adSlots, scans, leads }: DashboardClientProps) {
  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <h1>Your ad slots</h1>
        <EnableNotificationsButton />
      </header>

      {adSlots.length === 0 && <p>No ad slots yet — reach out to get one set up.</p>}

      {adSlots.map((slot) => {
        const slotScans = scans.filter((scan) => scan.ad_slot_id === slot.id);
        const slotLeads = leads.filter((lead) => lead.ad_slot_id === slot.id);

        return (
          <section key={slot.id} className="ad-slot-card">
            <h2>{slot.business_name}</h2>
            <p className="ad-slot-card__meta">
              Code: <code>{slot.code}</code> · {slot.status}
            </p>
            <div className="ad-slot-card__stats">
              <div>
                <strong>{slotScans.length}</strong>
                <span>scans</span>
              </div>
              <div>
                <strong>{slotLeads.length}</strong>
                <span>leads</span>
              </div>
            </div>

            {slotLeads.length > 0 && (
              <table className="lead-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {slotLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.name ?? "—"}</td>
                      <td>{lead.email ?? "—"}</td>
                      <td>{lead.phone ?? "—"}</td>
                      <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        );
      })}
    </main>
  );
}
