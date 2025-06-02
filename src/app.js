import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import { Nav } from 'react-bootstrap';
import { Navbar } from 'react-bootstrap';
import { LinkContainer } from "react-router-bootstrap";

import MapComponent from "./Components/Map";
import SearchComponent from "./Components/Search";
import InfoComponent from "./Components/Info";
import FavouriteStopsComponent from "./Components/FavouriteStops";

import axios from 'axios';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);

  const [favouriteStops, setFavouriteStops] = useState(() => {
    const saved = localStorage.getItem("favouriteStops");
    return saved ? JSON.parse(saved) : [];
  });

  // Загружаем остановки при монтировании компонента
  useEffect(() => {
    async function loadStops() {
      try {
        const response = await axios.get("http://localhost:8000/getStopsCoord");
        // Ответ ожидается в формате { stops: [...] }
        const data = response.data;
        setStops(data.stops || []);
      } catch (error) {
        console.error("Ошибка при загрузке остановок:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStops();
  }, []);

  // Обработчик выбора остановки
  const handleStopSelect = (stop) => {
    setSelectedStop(stop);
  };

  // Добавление в избранное
  const addFavouriteStop = (stop) => {
    if (!favouriteStops.some(s => s.KS_ID === stop.KS_ID)) {
      const updated = [...favouriteStops, stop];
      setFavouriteStops(updated);
      localStorage.setItem("favouriteStops", JSON.stringify(updated));
    }
  };

  // Удаление из избранных
  const removeFavouriteStop = (stop) => {
    const updated = favouriteStops.filter(s => s.KS_ID !== stop.KS_ID);
    setFavouriteStops(updated);
    localStorage.setItem("favouriteStops", JSON.stringify(updated));
  };

  if (loading) {
    return <div>Пожалуйста, подождите...</div>;
  }

  return (
    <>
      <Navbar collapseOnSelect bg="light" expand="md" className="mb-3 px-3">
        <LinkContainer to="/">
          <Navbar.Brand className="fw-bold text-muted">Transport forecast</Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-left">
          <Nav activeKey={window.location.pathname}>
            <LinkContainer to="/map">
              <Nav.Link>Карта</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/search">
              <Nav.Link>Поиск</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/favourite">
              <Nav.Link>Избранное</Nav.Link>
            </LinkContainer>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      <Routes>
        <Route
          path="/"
          element={
            <MapComponent
              stops={stops}
              favouriteStops={favouriteStops}
              handleStopSelect={handleStopSelect}
              addFavouriteStop={addFavouriteStop}
              selectedStop={selectedStop}
            />
          }
        />
        <Route
          path="/map"
          element={
            <MapComponent
              stops={stops}
              favouriteStops={favouriteStops}
              handleStopSelect={handleStopSelect}
              addFavouriteStop={addFavouriteStop}
              selectedStop={selectedStop}
            />
          }
        />
        <Route
          path="/search"
          element={
            <SearchComponent
              stops={stops}
              favouriteStops={favouriteStops}
              handleStopSelect={handleStopSelect}
            />
          }
        />
        <Route
          path="/info"
          element={<InfoComponent selectedStop={selectedStop} />}
        />
        <Route
          path="/favourite"
          element={
            <FavouriteStopsComponent
              favouriteStops={favouriteStops}
              removeFavouriteStop={removeFavouriteStop}
              handleStopSelect={handleStopSelect}
            />
          }
        />
      </Routes>
    </>
  );
}