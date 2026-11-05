export function Icon({ name, className = '' }: { name: 'arrow' | 'star' | 'github' | 'check' | 'chevron' | 'menu' | 'close' | 'code'; className?: string }) {
  const paths = {
    arrow: <><path d="M4 12h15M13 5l7 7-7 7" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />,
    github: <><path d="M9 19c-4.5 1.3-4.5-2.3-6-2.8m12 5v-3.6a3.1 3.1 0 0 0-.9-2.4c3-.3 6.1-1.5 6.1-6.8A5.3 5.3 0 0 0 18.8 5a5 5 0 0 0-.1-3s-1.1-.4-3.7 1.4a13 13 0 0 0-6.6 0C5.9 1.6 4.7 2 4.7 2a5 5 0 0 0-.1 3 5.3 5.3 0 0 0-1.4 3.6c0 5.3 3.2 6.5 6.1 6.8a3.1 3.1 0 0 0-.9 2.4v3.6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    code: <><path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" /></>,
  };
  return <svg className={'icon ' + className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
