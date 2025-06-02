const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sha1 = require('js-sha1');
const libxmljs = require('libxmljs');

const app = express();

app.use(cors());
app.use(express.json());

let stopData = { busStopsValue: [] };
const stopDataMap = new Map();

// Получение данных о остановках и их кэширование
const fetchStopData = async () => {
  try {
    const response = await axios.get('https://tosamara.ru/api/v2/classifiers/stopsFullDB.xml', {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    });
    const xmlData = libxmljs.parseXml(response.data);
    const stopsArray = [];

    xmlData.childNodes().forEach((stopNode) => {
      if (stopNode.type() === 'element') {
        const obj = {};
        stopNode.childNodes().forEach((child) => {
          if (child.type() === 'element') {
            obj[child.name()] = child.text();
          }
        });
        stopsArray.push(obj);
        stopDataMap.set(obj.KS_ID, obj);
      }
    });

    stopData.busStopsValue = stopsArray;
  } catch (error) {
    console.error('Ошибка при получении данных о остановках:', error);
  }
};

// Инициализировать при запуске
fetchStopData();

// Получение данных о остановках
const getStopsCoord = () => {
  const stops = stopData.busStopsValue.map((stop) => ({
    KS_ID: stop.KS_ID,
    title: stop.title,
    direction: stop.direction,
    latitude: stop.latitude,
    longitude: stop.longitude
  }));
  return { stops };
};

// Получение данных о конкретной остановке по ID
const getStopById = (id) => {
  return stopDataMap.get(id) || {};
};

// Получение информации о первом прибытии к остановке
const getFirstArrivalToStop = async (ks_id) => {
  const authkey = sha1(ks_id + 'just_f0r_tests');
  const url = `https://tosamara.ru/api/v2/json?method=getFirstArrivalToStop&KS_ID=${ks_id}&os=android&clientid=test&authkey=${authkey}`;

  try {
    const response = await axios.get(url);
    const arrivals = response.data.arrival || [];
    const result = arrivals.map((arrival) => ({
      type: arrival.type,
      number: arrival.number,
      time: arrival.time,
      hullNo: arrival.hullNo
    }));
    return { result };
  } catch (error) {
    console.error('Ошибка при получении первого прибытия:', error);
    return { result: [] };
  }
};

// Получение позиции транспорта
const getTransportPosition = async (hullno) => {
  const authkey = sha1(hullno + 'just_f0r_tests');
  const url = `https://tosamara.ru/api/v2/json?method=getTransportPosition&HULLNO=${hullno}&os=android&clientid=test&authkey=${authkey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;
    const nextStops = [];

    if (data.nextStops) {
      data.nextStops.forEach((arrival) => {
        const stopInfo = stopDataMap.get(arrival.KS_ID) || {};
        nextStops.push({
          KS_ID: arrival.KS_ID,
          time: arrival.time,
          title: stopInfo.title || '',
          adjacentStreet: stopInfo.adjacentStreet || '',
          direction: stopInfo.direction || ''
        });
      });
    }

    return { nextStops };
  } catch (error) {
    console.error('Ошибка при получении позиции транспорта:', error);
    return { nextStops: [] };
  }
};

// API маршруты
app.get('/getStopData', (req, res) => {
  res.json(stopData);
});

app.get('/getStopsCoord', (req, res) => {
  res.json(getStopsCoord());
});

app.get('/getFirstArrivalToStop', async (req, res) => {
  const { KS_ID } = req.query;
  if (!KS_ID) {
    return res.status(400).json({ error: 'KS_ID параметр обязателен' });
  }
  const result = await getFirstArrivalToStop(KS_ID);
  res.json(result);
});

app.get('/getTransportPosition', async (req, res) => {
  const { hullNo } = req.query;
  if (!hullNo) {
    return res.status(400).json({ error: 'hullNo параметр обязателен' });
  }
  const result = await getTransportPosition(hullNo);
  res.json(result);
});

app.get('/getStopById', (req, res) => {
  const { KS_ID } = req.query;
  if (!KS_ID) {
    return res.status(400).json({ error: 'KS_ID параметр обязателен' });
  }
  res.json(getStopById(KS_ID));
});

// Запуск сервера
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});