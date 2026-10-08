import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';

const items = [{ to: '/security/visitors', label: 'Visitor verification', icon: <ShieldCheck size={16} /> }];

export default function SecurityLayout({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar items={items} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar onMenu={() => setOpen(true)} />
        <main className="portal-main">{children}</main>
      </div>
    </div>
  );
}