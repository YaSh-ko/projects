<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class YandexRaspAPI {
    private $raspApiKey;
    private $geocoderApiKey;
    private $raspBaseUrl = "https://api.rasp.yandex.net/v3.0/";
    private $geocoderBaseUrl = "https://geocode-maps.yandex.ru/1.x/";
    private $copyrightUrl = "https://api.rasp.yandex.net/v3.0/copyright/";
    private $debugFile = 'debug.txt';
    private $memcached;

    public function __construct($raspApiKey, $geocoderApiKey) {
        $this->raspApiKey = $raspApiKey;
        $this->geocoderApiKey = $geocoderApiKey;

        $this->memcached = new Memcached();
        $this->memcached->addServer('localhost', 11211);

        if (!file_exists($this->debugFile)) {
            file_put_contents($this->debugFile, "\xEF\xBB\xBF"); // UTF-8 BOM
        }
    }

    /**
     * Выполняет HTTP-запрос с использованием cURL.
     *
     * @param string $url URL для запроса
     * @param int $timeout Таймаут запроса (по умолчанию 30 секунд)
     * @return array Результат запроса в виде массива
     * @throws Exception Если произошла ошибка cURL или декодирования JSON
     */
    private function makeRequest($url, $timeout = 30) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Ошибка cURL: " . $error);
        }

        curl_close($ch);

        $data = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Ошибка декодирования JSON: " . json_last_error_msg());
        }

        return $data;
    }

    /**
     * Получает координаты по адресу с использованием Яндекс Геокодера.
     *
     * @param string $address Адрес для поиска координат
     * @return array Массив с широтой и долготой
     * @throws Exception Если координаты не найдены
     */
    public function getCoordinatesByAddress($address) {
        $cacheKey = 'coords_' . md5($address);
        $cachedData = $this->memcached->get($cacheKey);

        if ($cachedData) {
            return $cachedData;
        }

        $queryParams = [
            'apikey' => $this->geocoderApiKey,
            'geocode' => $address,
            'format' => 'json'
        ];

        $url = $this->geocoderBaseUrl . '?' . http_build_query($queryParams, '', '&', PHP_QUERY_RFC3986);
        $data = $this->makeRequest($url);

        if (isset($data['response']['GeoObjectCollection']['featureMember'][0])) {
            $point = $data['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']['Point']['pos'];
            list($lng, $lat) = explode(' ', $point);
            $result = ['lat' => $lat, 'lng' => $lng];

            $this->memcached->set($cacheKey, $result, 3600); // Кэшируем на 1 час
            return $result;
        } else {
            throw new Exception("Координаты для адреса '$address' не найдены");
        }
    }

    /**
     * Получает ближайший населенный пункт по координатам.
     *
     * @param float $lat Широта
     * @param float $lng Долгота
     * @param int $distance Расстояние для поиска (по умолчанию 10 км)
     * @return array Данные о ближайшем населенном пункте
     * @throws Exception Если произошла ошибка запроса
     */
    public function getNearestSettlement($lat, $lng, $distance = 10) {
        $queryParams = [
            'apikey' => $this->raspApiKey,
            'lat' => $lat,
            'lng' => $lng,
            'distance' => $distance,
            'format' => 'json',
            'lang' => 'ru_RU'
        ];

        $url = $this->raspBaseUrl . "nearest_settlement/?" . http_build_query($queryParams, '', '&', PHP_QUERY_RFC3986);
        return $this->makeRequest($url);
    }

    /**
     * Получает маршруты между двумя пунктами.
     *
     * @param string $from Код начального пункта
     * @param string $to Код конечного пункта
     * @param array $params Дополнительные параметры запроса
     * @return array Данные о маршрутах
     * @throws Exception Если произошла ошибка запроса
     */
    public function getRoutes($from, $to, $params = []) {
        $queryParams = [
            'apikey' => $this->raspApiKey,
            'from' => $from,
            'to' => $to,
            'format' => 'json',
            'lang' => 'ru_RU'
        ];

        foreach ($params as $key => $value) {
            if (is_bool($value)) {
                $params[$key] = $value ? 'true' : 'false';
            }
        }

        $queryParams = array_merge($queryParams, $params);
        $url = $this->raspBaseUrl . "search/?" . http_build_query($queryParams, '', '&', PHP_QUERY_RFC3986);
        return $this->makeRequest($url);
    }

    /**
     * Получает информацию о копирайте.
     *
     * @return array|null Данные о копирайте или null, если произошла ошибка
     */
    public function getCopyright() {
        $queryParams = [
            'apikey' => $this->raspApiKey,
            'format' => 'json'
        ];

        $url = $this->copyrightUrl . '?' . http_build_query($queryParams, '', '&', PHP_QUERY_RFC3986);
        $data = $this->makeRequest($url);

        return $data['copyright'] ?? null;
    }

    /**
     * Логирует сообщение в файл.
     *
     * @param string $message Сообщение для логирования
     */
    private function log($message) {
        file_put_contents($this->debugFile, date('Y-m-d H:i:s') . " - " . $message . PHP_EOL, FILE_APPEND);
    }
}

// Обработка POST-запроса
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (isset($data['from']) && isset($data['to']) && isset($data['date'])) {
        $raspApiKey = '7f39bc42-6b3c-4701-885d-b8b0f6d0c8cf'; // Ключ API Яндекс.Расписаний
        $geocoderApiKey = '52343553-ee73-4f1a-ae89-1c7af22d3b44'; // Ключ Яндекс Геокодера

        $api = new YandexRaspAPI($raspApiKey, $geocoderApiKey);

        try {
            // Получаем координаты для начального и конечного адресов
            $fromCoords = $api->getCoordinatesByAddress($data['from']);
            $toCoords = $api->getCoordinatesByAddress($data['to']);

            // Получаем ближайшие населенные пункты
            $fromSettlement = $api->getNearestSettlement($fromCoords['lat'], $fromCoords['lng']);
            $toSettlement = $api->getNearestSettlement($toCoords['lat'], $toCoords['lng']);

            // Получаем маршруты
            $routes = $api->getRoutes($fromSettlement['code'], $toSettlement['code'], [
                'date' => $data['date'],
                'limit' => 15,
                'transfers' => true
            ]);
            
            // Определяем коэффициенты для разных типов транспорта
            $transportPricing = [
                'plane' => 15.0,
                'bus' => 1.2,
                'train' => 1.0,
                'suburban' => 0.9,
                'другие' => 1.0 // Коэффициент для неизвестных типов транспорта
            ];

            // Если маршруты найдены, рассчитываем цены
            if (isset($routes['segments']) && is_array($routes['segments'])) {
                foreach ($routes['segments'] as &$segment) {
                    $totalPrice = 0;

                    // Если есть подмаршруты (детали), рассчитываем стоимость для каждого
                    if (isset($segment['details']) && is_array($segment['details'])) {
                        foreach ($segment['details'] as $detail) {
                            $duration = (strtotime($detail['arrival']) - strtotime($detail['departure'])) / 60; // Время в минутах
                            $basePrice = $duration * 5; // Базовая цена: 5 рублей за минуту

                            // Определяем тип транспорта
                            $transportType = strtolower($detail['thread']['transport_type'] ?? 'другие');

                            // Выбираем коэффициент (если нет в списке — ставим "другие")
                            $multiplier = $transportPricing[$transportType] ?? $transportPricing['другие'];

                            // Рассчитываем стоимость подмаршрута
                            $detailPrice = round($basePrice * $multiplier);
                            $totalPrice += $detailPrice;
                        }
                    } else {
                        // Если подмаршрутов нет, рассчитываем стоимость для основного сегмента
                        $duration = (strtotime($segment['arrival']) - strtotime($segment['departure'])) / 60; // Время в минутах
                        $basePrice = $duration * 5; 

                        $transportType = strtolower($segment['thread']['transport_type'] ?? 'другие');

                        $multiplier = $transportPricing[$transportType] ?? $transportPricing['другие'];

                        $totalPrice = round($basePrice * $multiplier);
                    }

                    // Сохраняем общую стоимость маршрута
                    $segment['calculated_price'] = $totalPrice;
                }
            }

            
            // Проверяем, какой фильтр выбрал пользователь
             if ($data['filter'] === 'time') {
                // Сортируем по времени в пути
                usort($routes['segments'], function ($a, $b) {
                    $durationA = strtotime($a['arrival']) - strtotime($a['departure']);
                    $durationB = strtotime($b['arrival']) - strtotime($b['departure']);
                    return $durationA <=> $durationB;
                });
            } 
            elseif ($data['filter'] === 'price') {
                usort($routes['segments'], function ($a, $b) {
                    $priceA = $a['calculated_price'] ?? PHP_INT_MAX;
                    $priceB = $b['calculated_price'] ?? PHP_INT_MAX;
                    return $priceA <=> $priceB;
                });
            }

            // Получаем копирайт
            $copyright = $api->getCopyright();

            // Отправляем результат
            echo json_encode([
                'routes' => $routes,
                'copyright' => $copyright
            ]);
            
        } catch (Exception $e) {
            // Логируем ошибку и отправляем сообщение клиенту
            $api->log("Ошибка: " . $e->getMessage());
            echo json_encode(['error' => 'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.']);
        }
    } else {
        echo json_encode(['error' => 'Не все обязательные данные были переданы']);
    }
}