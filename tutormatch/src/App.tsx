import { Switch, Route, Redirect } from 'wouter'
import { LangProvider } from './lib/lang-context'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import TutorBrowsePage from './pages/TutorBrowsePage'
import TutorDashboardPage from './pages/TutorDashboardPage'
import ParentBrowsePage from './pages/ParentBrowsePage'
import ParentDashboardPage from './pages/ParentDashboardPage'
import PostRequestPage from './pages/PostRequestPage'

export default function App() {
  return (
    <LangProvider>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/tutor/browse" component={TutorBrowsePage} />
        <Route path="/tutor/dashboard" component={TutorDashboardPage} />
        <Route path="/parent/browse" component={ParentBrowsePage} />
        <Route path="/parent/dashboard" component={ParentDashboardPage} />
        <Route path="/parent/post" component={PostRequestPage} />
        <Route><Redirect to="/" /></Route>
      </Switch>
    </LangProvider>
  )
}
