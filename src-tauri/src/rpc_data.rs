use std::collections::HashMap;
use std::sync::Mutex;

struct RpcData {
    cars: HashMap<String, String>,
    events: HashMap<u32, (String, String)>,
}

static RPC_DATA: Mutex<Option<RpcData>> = Mutex::new(None);

pub async fn init_remote(server_ip: &str) {
    let base = server_ip.trim_end_matches('/');
    let mod_info_url = format!("{}/Modding/GetModInfo", base);

    let client = match reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            eprintln!("[RPC_DATA] Failed to build HTTP client: {}", e);
            return;
        }
    };

    let base_path = match client.get(&mod_info_url).send().await {
        Ok(resp) => match resp.text().await {
            Ok(text) => {
                match serde_json::from_str::<serde_json::Value>(&text) {
                    Ok(json) => {
                        match json.get("basePath").and_then(|v| v.as_str()) {
                            Some(p) => p.trim_end_matches('/').to_string(),
                            None => {
                                eprintln!("[RPC_DATA] GetModInfo has no basePath field");
                                return;
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("[RPC_DATA] Failed to parse GetModInfo JSON: {}", e);
                        return;
                    }
                }
            }
            Err(e) => {
                eprintln!("[RPC_DATA] Failed to read GetModInfo response: {}", e);
                return;
            }
        },
        Err(e) => {
            eprintln!("[RPC_DATA] Failed to fetch {}: {}", mod_info_url, e);
            return;
        }
    };

    eprintln!("[RPC_DATA] basePath = {}", base_path);

    let cars_url = format!("{}/cars.json", base_path);
    let events_url = format!("{}/events.json", base_path);

    let cars = fetch_cars(&client, &cars_url).await;
    let events = fetch_events(&client, &events_url).await;

    eprintln!(
        "[RPC_DATA] Loaded {} cars, {} events from {}",
        cars.len(),
        events.len(),
        base_path
    );

    let mut lock = RPC_DATA.lock().unwrap();
    *lock = Some(RpcData { cars, events });
}

pub fn get_car_name(id: &str) -> String {
    let lock = RPC_DATA.lock().unwrap();
    if let Some(data) = lock.as_ref() {
        if let Some(name) = data.cars.get(id) {
            return name.clone();
        }
    }
    id.to_string()
}

pub fn get_event_name(id: u32) -> String {
    let lock = RPC_DATA.lock().unwrap();
    if let Some(data) = lock.as_ref() {
        if let Some((trackname, _)) = data.events.get(&id) {
            return trackname.clone();
        }
    }
    format!("EVENT:{}", id)
}

pub fn get_event_type(id: u32) -> String {
    let lock = RPC_DATA.lock().unwrap();
    if let Some(data) = lock.as_ref() {
        if let Some((_, etype)) = data.events.get(&id) {
            return etype.clone();
        }
    }
    "gamemode_freeroam".to_string()
}


async fn fetch_cars(client: &reqwest::Client, url: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    let text = match client.get(url).send().await {
        Ok(resp) => match resp.text().await {
            Ok(t) => t,
            Err(e) => {
                eprintln!("[RPC_DATA] Failed to read cars response: {}", e);
                return map;
            }
        },
        Err(e) => {
            eprintln!("[RPC_DATA] Failed to fetch {}: {}", url, e);
            return map;
        }
    };

    match serde_json::from_str::<Vec<serde_json::Value>>(&text) {
        Ok(arr) => {
            for item in arr {
                if let (Some(id), Some(name)) = (
                    item.get("carid").and_then(|v| v.as_str()),
                    item.get("carname").and_then(|v| v.as_str()),
                ) {
                    map.insert(id.to_string(), name.to_string());
                }
            }
        }
        Err(e) => eprintln!("[RPC_DATA] Failed to parse cars.json: {}", e),
    }
    map
}

async fn fetch_events(client: &reqwest::Client, url: &str) -> HashMap<u32, (String, String)> {
    let mut map = HashMap::new();
    let text = match client.get(url).send().await {
        Ok(resp) => match resp.text().await {
            Ok(t) => t,
            Err(e) => {
                eprintln!("[RPC_DATA] Failed to read events response: {}", e);
                return map;
            }
        },
        Err(e) => {
            eprintln!("[RPC_DATA] Failed to fetch {}: {}", url, e);
            return map;
        }
    };

    match serde_json::from_str::<Vec<serde_json::Value>>(&text) {
        Ok(arr) => {
            for item in arr {
                let id_opt = item.get("id").and_then(|v| {
                    v.as_u64()
                        .map(|n| n as u32)
                        .or_else(|| v.as_str().and_then(|s| s.parse::<u32>().ok()))
                });
                if let (Some(id), Some(trackname), Some(etype)) = (
                    id_opt,
                    item.get("trackname").and_then(|v| v.as_str()),
                    item.get("type").and_then(|v| v.as_str()),
                ) {
                    map.insert(id, (trackname.to_string(), etype.to_string()));
                }
            }
        }
        Err(e) => eprintln!("[RPC_DATA] Failed to parse events.json: {}", e),
    }
    map
}
