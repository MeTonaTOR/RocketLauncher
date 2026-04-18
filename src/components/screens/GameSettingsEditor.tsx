"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getGameSettings, setGameSettings } from "@/lib/tauri-api";
import { X, Save, RotateCcw } from "lucide-react";

interface GameSettings {
  screen_width: number;
  screen_height: number;
  screen_windowed: boolean;
  brightness: number;
  vsync: boolean;
  performance_level: number;
  
  base_texture_filter: number;
  base_texture_max_anisotropy: number;
  road_texture_filter: number;
  road_texture_max_anisotropy: number;
  car_environment_map: number;
  global_detail_level: number;
  road_reflection: number;
  shader_detail: number;
  shadow_detail: number;
  
  fsaa_level: number;
  motion_blur: boolean;
  particle_system: boolean;
  post_processing: boolean;
  rain: boolean;
  water_sim: boolean;
  visual_treatment: boolean;
  max_skid_marks: number;
  
  audio_mode: number;
  audio_quality: number;
  master_volume: number;
  sfx_volume: number;
  car_volume: number;
  speech_volume: number;
  music_volume: number;
  frontend_music_volume: number;
  
  camera: number;
  transmission: number;
  damage: boolean;
  speed_units: number;
}

interface GameSettingsEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameSettingsEditor({ isOpen, onClose }: GameSettingsEditorProps) {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"video" | "audio" | "gameplay">("video");
  const [animKey, setAnimKey] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (isOpen) {
      setAnimKey((k) => k + 1);
      loadSettings();
    }
  }, [isOpen]);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      const parent = el.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        setIndicatorStyle({ left: rect.left - parentRect.left, width: rect.width });
      }
    }
  }, [activeTab, animKey]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await getGameSettings();
      setSettings(loaded);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("not found")) {
        setError("UserSettings.xml not found. Please launch the game at least once to create the settings file.");
      } else {
        setError(`Failed to load settings: ${errorMsg}`);
      }
      setSettings({
        screen_width: 1024,
        screen_height: 768,
        screen_windowed: false,
        brightness: 52,
        vsync: true,
        performance_level: 2,
        base_texture_filter: 0,
        base_texture_max_anisotropy: 0,
        road_texture_filter: 0,
        road_texture_max_anisotropy: 0,
        car_environment_map: 0,
        global_detail_level: 0,
        road_reflection: 0,
        shader_detail: 0,
        shadow_detail: 0,
        fsaa_level: 0,
        motion_blur: false,
        particle_system: false,
        post_processing: false,
        rain: false,
        water_sim: false,
        visual_treatment: false,
        max_skid_marks: 0,
        audio_mode: 1,
        audio_quality: 0,
        master_volume: 1.0,
        sfx_volume: 0.52,
        car_volume: 0.52,
        speech_volume: 0.52,
        music_volume: 0.52,
        frontend_music_volume: 0.52,
        camera: 2,
        transmission: 1,
        damage: true,
        speed_units: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      await setGameSettings(settings);
      onClose();
    } catch {
      alert("Failed to save settings. Make sure the game has been launched at least once.");
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: number) => {
    if (!settings) return;

    const presets: Record<number, Partial<GameSettings>> = {
      0: {
        performance_level: 0,
        base_texture_filter: 0,
        base_texture_max_anisotropy: 0,
        road_texture_filter: 0,
        road_texture_max_anisotropy: 0,
        car_environment_map: 0,
        global_detail_level: 0,
        road_reflection: 0,
        shader_detail: 0,
        shadow_detail: 0,
        fsaa_level: 0,
        motion_blur: false,
        particle_system: false,
        post_processing: false,
        rain: false,
        water_sim: false,
        visual_treatment: false,
        max_skid_marks: 0,
      },
      1: {
        performance_level: 1,
        base_texture_filter: 0,
        base_texture_max_anisotropy: 0,
        road_texture_filter: 0,
        road_texture_max_anisotropy: 0,
        car_environment_map: 1,
        global_detail_level: 1,
        road_reflection: 0,
        shader_detail: 1,
        shadow_detail: 0,
        fsaa_level: 0,
        motion_blur: false,
        particle_system: true,
        post_processing: false,
        rain: true,
        water_sim: false,
        visual_treatment: false,
        max_skid_marks: 0,
      },
      2: {
        performance_level: 2,
        base_texture_filter: 1,
        base_texture_max_anisotropy: 2,
        road_texture_filter: 1,
        road_texture_max_anisotropy: 2,
        car_environment_map: 2,
        global_detail_level: 2,
        road_reflection: 1,
        shader_detail: 2,
        shadow_detail: 1,
        fsaa_level: 0,
        motion_blur: false,
        particle_system: true,
        post_processing: true,
        rain: true,
        water_sim: true,
        visual_treatment: false,
        max_skid_marks: 1,
      },
      3: {
        performance_level: 3,
        base_texture_filter: 2,
        base_texture_max_anisotropy: 8,
        road_texture_filter: 2,
        road_texture_max_anisotropy: 8,
        car_environment_map: 3,
        global_detail_level: 3,
        road_reflection: 2,
        shader_detail: 4,
        shadow_detail: 2,
        fsaa_level: 2,
        motion_blur: true,
        particle_system: true,
        post_processing: true,
        rain: true,
        water_sim: true,
        visual_treatment: true,
        max_skid_marks: 2,
      },
      4: {
        performance_level: 4,
        base_texture_filter: 2,
        base_texture_max_anisotropy: 16,
        road_texture_filter: 2,
        road_texture_max_anisotropy: 16,
        car_environment_map: 4,
        global_detail_level: 4,
        road_reflection: 2,
        shader_detail: 4,
        shadow_detail: 2,
        fsaa_level: 4,
        motion_blur: true,
        particle_system: true,
        post_processing: true,
        rain: true,
        water_sim: true,
        visual_treatment: true,
        max_skid_marks: 2,
      },
    };

    setSettings({ ...settings, ...presets[preset] });
  };

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advanced Game Settings">
      <div className="flex flex-col h-[600px]">
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-muted">Loading game settings...</p>
            </div>
          </div>
        )}
        {!loading && error && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                <X className="w-8 h-8 text-accent" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Cannot Load Settings</h3>
                <p className="text-sm text-muted">{error}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
                <Button variant="primary" onClick={loadSettings}>
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}
        {!loading && !error && settings && (
          <>
            <div key={`tabs-${animKey}`} className="relative flex gap-2 mb-4 border-b border-border animate-fade-in-up" style={{ animationDelay: "60ms" }}>
              {([ "video", "audio", "gameplay"] as const).map((tab) => (
                <button
                  key={tab}
                  ref={(el) => { tabRefs.current[tab] = el; }}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium transition-colors capitalize ${
                    activeTab === tab ? "text-primary" : "text-muted hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
              <span
                className="absolute bottom-0 h-0.5 bg-primary rounded-full"
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                  transition: "left 220ms cubic-bezier(0.4,0,0.2,1), width 220ms cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            </div>
            <div key={`presets-${animKey}`} className="flex gap-2 mb-4 p-3 bg-surface rounded-lg animate-fade-in-up" style={{ animationDelay: "120ms" }}>
              <span className="text-sm text-muted mr-2 self-center">Graphics Preset:</span>
              {["Min", "Low", "Med", "High", "Max"].map((name, idx) => (
                <Button
                  key={idx}
                  variant={settings.performance_level === idx ? "primary" : "secondary"}
                  size="sm"
              onClick={() => applyPreset(idx)}
            >
              {name}
            </Button>
          ))}
        </div>
        <div key={`${activeTab}-${animKey}`} className="flex-1 overflow-y-auto space-y-4 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          {activeTab === "video" && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">Display</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted">Resolution Width</span>
                    <input
                      type="number"
                      value={settings.screen_width}
                      onChange={(e) => updateSetting("screen_width", parseInt(e.target.value) || 1024)}
                      className="bg-surface border border-border rounded px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted">Resolution Height</span>
                    <input
                      type="number"
                      value={settings.screen_height}
                      onChange={(e) => updateSetting("screen_height", parseInt(e.target.value) || 768)}
                      className="bg-surface border border-border rounded px-2 py-1 text-sm"
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.screen_windowed}
                    onChange={(e) => updateSetting("screen_windowed", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Windowed Mode</span>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Brightness: {settings.brightness}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.brightness}
                    onChange={(e) => updateSetting("brightness", parseInt(e.target.value))}
                    className="w-full"
                  />
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.vsync}
                    onChange={(e) => updateSetting("vsync", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">V-Sync</span>
                </label>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">Textures</h3>
                
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Base Texture Filter</span>
                  <select
                    value={settings.base_texture_filter}
                    onChange={(e) => updateSetting("base_texture_filter", parseInt(e.target.value))}
                    className="bg-surface border border-border rounded px-2 py-1 text-sm"
                  >
                    <option value="0">Bilinear</option>
                    <option value="1">Trilinear</option>
                    <option value="2">Anisotropic</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Anisotropy Level</span>
                  <select
                    value={settings.base_texture_max_anisotropy}
                    onChange={(e) => updateSetting("base_texture_max_anisotropy", parseInt(e.target.value))}
                    className="bg-surface border border-border rounded px-2 py-1 text-sm"
                  >
                    <option value="0">Off</option>
                    <option value="2">2x</option>
                    <option value="4">4x</option>
                    <option value="8">8x</option>
                    <option value="16">16x</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Road Texture Filter</span>
                  <select
                    value={settings.road_texture_filter}
                    onChange={(e) => updateSetting("road_texture_filter", parseInt(e.target.value))}
                    className="bg-surface border border-border rounded px-2 py-1 text-sm"
                  >
                    <option value="0">Minimum</option>
                    <option value="1">Medium</option>
                    <option value="2">Maximum</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Road Anisotropy</span>
                  <select
                    value={settings.road_texture_max_anisotropy}
                    onChange={(e) => updateSetting("road_texture_max_anisotropy", parseInt(e.target.value))}
                    className="bg-surface border border-border rounded px-2 py-1 text-sm"
                  >
                    <option value="0">Off</option>
                    <option value="2">2x</option>
                    <option value="4">4x</option>
                    <option value="8">8x</option>
                    <option value="16">16x</option>
                  </select>
                </label>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">Quality</h3>
                
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Global Detail Level</span>
                  <select
                    value={settings.global_detail_level}
                    onChange={(e) => updateSetting("global_detail_level", parseInt(e.target.value))}
                    className="bg-surface border border-border rounded px-2 py-1 text-sm"
                  >
                    <option value="0">Minimum</option>
                    <option value="1">Low</option>
                    <option value="2">Medium</option>
                    <option value="3">High</option>
                    <option value="4">Maximum</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Car Environment Map</span>
                  <select
                    value={settings.car_environment_map}
                    onChange={(e) => updateSetting("car_environment_map", parseInt(e.target.value))}
                    className="bg-surface border border-border rounded px-2 py-1 text-sm"
                  >
                    <option value="0">Minimum</option>
                    <option value="1">Low</option>
                    <option value="2">Medium</option>
                    <option value="3">High</option>
                    <option value="4">Maximum</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Road Reflections</span>
                  <select
                    value={settings.road_reflection}
                    onChange={(e) => updateSetting("road_reflection", parseInt(e.target.value))}
                    className="bg-surface border border-border rounded px-2 py-1 text-sm"
                  >
                    <option value="0">Minimum</option>
                    <option value="1">Medium</option>
                    <option value="2">Maximum</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Shader Detail</span>
                  <select
                    value={settings.shader_detail}
                    onChange={(e) => updateSetting("shader_detail", parseInt(e.target.value))}
                    className="bg-surface border border-border rounded px-2 py-1 text-sm"
                  >
                    <option value="0">Minimum</option>
                    <option value="1">Low</option>
                    <option value="2">Medium</option>
                    <option value="4">High</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Shadow Detail</span>
                  <select
                    value={settings.shadow_detail}
                    onChange={(e) => updateSetting("shadow_detail", parseInt(e.target.value))}
                    className="bg-surface border border-border rounded px-2 py-1 text-sm"
                  >
                    <option value="0">Low</option>
                    <option value="1">Medium</option>
                    <option value="2">High</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Anti-Aliasing (FSAA)</span>
                  <select
                    value={settings.fsaa_level}
                    onChange={(e) => updateSetting("fsaa_level", parseInt(e.target.value))}
                    className="bg-surface border border-border rounded px-2 py-1 text-sm"
                  >
                    <option value="0">Off</option>
                    <option value="2">2x</option>
                    <option value="4">4x</option>
                  </select>
                </label>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">Effects</h3>
                
                {[
                  { key: "motion_blur" as const, label: "Motion Blur" },
                  { key: "particle_system" as const, label: "Particle System" },
                  { key: "post_processing" as const, label: "Post Processing" },
                  { key: "rain" as const, label: "Rain" },
                  { key: "water_sim" as const, label: "Water Simulation" },
                  { key: "visual_treatment" as const, label: "Visual Treatment" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings[key]}
                      onChange={(e) => updateSetting(key, e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Max Skid Marks</span>
                  <select
                    value={settings.max_skid_marks}
                    onChange={(e) => updateSetting("max_skid_marks", parseInt(e.target.value))}
                    className="bg-surface border border-border rounded px-2 py-1 text-sm"
                  >
                    <option value="0">Off</option>
                    <option value="1">Low</option>
                    <option value="2">High</option>
                  </select>
                </label>
              </div>
            </>
          )}

          {activeTab === "audio" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary">Audio Settings</h3>
              
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">Audio Mode</span>
                <select
                  value={settings.audio_mode}
                  onChange={(e) => updateSetting("audio_mode", parseInt(e.target.value))}
                  className="bg-surface border border-border rounded px-2 py-1 text-sm"
                >
                  <option value="1">Stereo</option>
                  <option value="2">Surround</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">Audio Quality</span>
                <select
                  value={settings.audio_quality}
                  onChange={(e) => updateSetting("audio_quality", parseInt(e.target.value))}
                  className="bg-surface border border-border rounded px-2 py-1 text-sm"
                >
                  <option value="0">Low (Filter On)</option>
                  <option value="1">High (Filter Off)</option>
                </select>
              </label>

              {[
                { key: "master_volume" as const, label: "Master Volume" },
                { key: "sfx_volume" as const, label: "SFX Volume" },
                { key: "car_volume" as const, label: "Car Volume" },
                { key: "speech_volume" as const, label: "Speech Volume" },
                { key: "music_volume" as const, label: "Event Music Volume" },
                { key: "frontend_music_volume" as const, label: "Menu Music Volume" },
              ].map(({ key, label }) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-xs text-muted">{label}: {Math.round(settings[key] * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings[key]}
                    onChange={(e) => updateSetting(key, parseFloat(e.target.value))}
                    className="w-full"
                  />
                </label>
              ))}
            </div>
          )}

          {activeTab === "gameplay" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary">Gameplay Settings</h3>
              
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">Default Camera</span>
                <select
                  value={settings.camera}
                  onChange={(e) => updateSetting("camera", parseInt(e.target.value))}
                  className="bg-surface border border-border rounded px-2 py-1 text-sm"
                >
                  <option value="0">Bumper</option>
                  <option value="1">Hood</option>
                  <option value="2">Near</option>
                  <option value="3">Far</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">Transmission</span>
                <select
                  value={settings.transmission}
                  onChange={(e) => updateSetting("transmission", parseInt(e.target.value))}
                  className="bg-surface border border-border rounded px-2 py-1 text-sm"
                >
                  <option value="0">Automatic</option>
                  <option value="1">Manual</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">Speed Units</span>
                <select
                  value={settings.speed_units}
                  onChange={(e) => updateSetting("speed_units", parseInt(e.target.value))}
                  className="bg-surface border border-border rounded px-2 py-1 text-sm"
                >
                  <option value="0">KM/H</option>
                  <option value="1">MPH</option>
                </select>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.damage}
                  onChange={(e) => updateSetting("damage", e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Car Damage</span>
              </label>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={loadSettings}
            disabled={loading || saving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || loading || !!error}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
          </>
        )}
      </div>
    </Modal>
  );
}
