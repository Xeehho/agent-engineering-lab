import { LandingPage } from './LandingPage.tsx';
import { Workbench } from './Workbench.tsx';

export function App() {
  return window.location.pathname.endsWith('/lab.html') ? <Workbench /> : <LandingPage />;
}
