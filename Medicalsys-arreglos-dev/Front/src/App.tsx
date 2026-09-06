import { BrowserRouter } from "react-router-dom";
import Nav from "./components/Nav";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <main>
          <AppRoutes />
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
