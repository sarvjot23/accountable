import { Command } from 'cmdk';
import { Building2, Handshake, Search, User } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useContacts } from '../features/contacts/api';
import { useDeals } from '../features/deals/api';
import { useOrganizations } from '../features/organizations/api';
import styles from './GlobalSearch.module.css';

const LIMIT = 6;

/** The top bar's search: finds deals, contacts and organizations by name as you type, and opens one (LAY-3). */
export function GlobalSearch() {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const deals = useDeals().data ?? [];
  const contacts = useContacts().data ?? [];
  const organizations = useOrganizations().data ?? [];

  const q = text.trim().toLowerCase();
  const match = (name: string) => q.length > 0 && name.toLowerCase().includes(q);
  const groups = [
    { heading: 'Deals', icon: Handshake, items: deals.filter((d) => match(d.name)).map((d) => ({ name: d.name, hint: d.organization_name, to: `/deals/${d.id}` })) },
    { heading: 'Contacts', icon: User, items: contacts.filter((c) => match(c.name)).map((c) => ({ name: c.name, hint: c.organization_name, to: `/contacts/${c.id}` })) },
    { heading: 'Organizations', icon: Building2, items: organizations.filter((o) => match(o.name)).map((o) => ({ name: o.name, hint: o.industry, to: `/organizations/${o.id}` })) },
  ];
  const showing = open && q.length > 0;

  function go(to: string) {
    setOpen(false);
    setText('');
    navigate(to);
  }

  return (
    <Command
      ref={box}
      shouldFilter={false}
      label="Search deals, people and companies"
      className={styles.command}
      onBlur={(e) => {
        if (!box.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <div className={styles.box}>
        <Search aria-hidden />
        <Command.Input
          value={text}
          onValueChange={(value) => {
            setText(value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Search deals, people, companies"
          aria-label="Search deals, people and companies"
          className={styles.input}
        />
      </div>
      {/* Always in the page, so the input's aria-controls points at something; hidden until there's text. */}
      <div className={styles.results} hidden={!showing} onMouseDown={(e) => e.preventDefault()}>
        <Command.List className={styles.list}>
          {showing && <Command.Empty className={styles.empty}>Nothing found for “{text.trim()}”</Command.Empty>}
          {groups.map(
            ({ heading, icon: Icon, items }) =>
              showing &&
              items.length > 0 && (
                <Command.Group key={heading} heading={heading} className={styles.group}>
                  {items.slice(0, LIMIT).map((item) => (
                    <Command.Item key={item.to} value={item.to} onSelect={() => go(item.to)} className={styles.item}>
                      <Icon aria-hidden />
                      <span className={styles.name}>{item.name}</span>
                      {item.hint && <span className={styles.hint}>{item.hint}</span>}
                    </Command.Item>
                  ))}
                </Command.Group>
              ),
          )}
        </Command.List>
      </div>
    </Command>
  );
}
