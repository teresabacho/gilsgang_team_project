import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import IndexPage from "./pages/IndexPage";
import SignupPage from "./pages/SignupPage";
import MoviesPage from "./pages/MoviesPage";
import SingleMoviePage from "./pages/SingleMoviePage";
import AccountPage from "./pages/AccountPage";
import axios from "axios";
import {UserProvider} from "./context/UserContext";
import SearchResultPage from "./pages/SearchResultPage";
import EditMoviePage from "./pages/EditMoviePage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import RoutesPage from "./pages/RoutesPage";
import FavoritesPage from './pages/FavoritesPage';
import RouteDetailsPage from './pages/RouteDetailsPage';

axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.withCredentials = true;



function App() {
    return (
       <UserProvider>

        <Router>
            <Routes>
                <Route path={'/'} element={<IndexPage/>}></Route>
                <Route path={'/login'} element={<LoginPage/>}></Route>
                <Route path={'/signup'} element={<SignupPage/>}></Route>
                <Route path={'/movielist'} element={<MoviesPage/>}></Route>
                <Route path="/movie/:id" element={<SingleMoviePage/>}> </Route>
                <Route path="/profile" element={<AccountPage/>}> </Route>
                <Route path="/searchresult" element={<SearchResultPage/>} />
                <Route path="/edit-movie/:id" element={<EditMoviePage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/routes" element={<RoutesPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/route/:routeId" element={<RouteDetailsPage />} />
            </Routes>
        </Router>
        </UserProvider>
    );
}

export default App;
