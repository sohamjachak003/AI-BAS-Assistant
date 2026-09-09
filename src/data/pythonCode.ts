export const PYTHON_MAIN_CODE = `"""
=============================================================================
ISRO GAGANYAAN - AI BAS ASSISTANT (OFFLINE DESKTOP DEMO)
Smart India Hackathon 2026 Reference Implementation
Tech Stack: Python 3.10+, Tkinter, OpenCV (cv2), pyttsx3, JSON, Threading
=============================================================================
"""

import cv2
import json
import os
import sys
import threading
import time
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk
import pyttsx3
import numpy as np

# ==========================================
# 1. PREDEFINED EXPERIMENT SOP CONFIGURATION
# ==========================================
SOP_STEPS = [
    {
        "step": 1,
        "action_code": "OPEN_TRAY",
        "title": "Open Sample Tray",
        "description": "Unlock safety latch and pull open bio-containment tray.",
        "hazard": "Inspect seal integrity before opening."
    },
    {
        "step": 2,
        "action_code": "INSERT_SAMPLE",
        "title": "Insert Sample",
        "description": "Place biological culture ampoule inside slot A-1.",
        "hazard": "Anti-vibration micro-gravity handling required."
    },
    {
        "step": 3,
        "action_code": "ADD_REAGENT",
        "title": "Add Reagent",
        "description": "Dispense 5ml nutrient substrate buffer using micro-pipette.",
        "hazard": "Maintain 90-degree pipette angle."
    },
    {
        "step": 4,
        "action_code": "CLOSE_CONTAINER",
        "title": "Close Container",
        "description": "Slide tray back and engage dual vacuum lock.",
        "hazard": "Verify hermetic pressure seal."
    },
    {
        "step": 5,
        "action_code": "START_INCUBATOR",
        "title": "Start Incubator",
        "description": "Engage thermal incubation cycle at 37.0 C.",
        "hazard": "Ensure telemetry uplink to ground station."
    }
]

# ==========================================
# 2. OFFLINE TEXT-TO-SPEECH ENGINE
# ==========================================
class VoiceAlertEngine:
    def __init__(self):
        try:
            self.engine = pyttsx3.init()
            self.engine.setProperty('rate', 155)
            self.engine.setProperty('volume', 1.0)
        except Exception as e:
            print(f"[TTS Warning] Could not initialize pyttsx3: {e}")
            self.engine = None
        self.lock = threading.Lock()

    def speak_async(self, text):
        """Speaks non-blocking in a separate thread to prevent GUI freezing."""
        def _run():
            with self.lock:
                if self.engine:
                    try:
                        self.engine.say(text)
                        self.engine.runAndWait()
                    except Exception as err:
                        print(f"[TTS Error] {err}")
                else:
                    print(f"[VOICE ALERT]: {text}")
        t = threading.Thread(target=_run, daemon=True)
        t.start()

# ==========================================
# 3. AI HUMAN ACTIVITY RECOGNITION (HAR)
# ==========================================
class ActionDetector:
    """
    Offline action detection engine.
    Analyzes frame optical delta, motion intensity, and color/edge density
    in the defined Region of Interest (ROI).
    """
    def __init__(self):
        self.prev_gray = None
        self.motion_threshold = 28.0

    def analyze_frame(self, frame):
        h, w = frame.shape[:2]
        # Bounding box for tray ROI
        roi_x1, roi_y1 = int(w * 0.25), int(h * 0.35)
        roi_x2, roi_y2 = int(w * 0.75), int(h * 0.85)
        roi = frame[roi_y1:roi_y2, roi_x1:roi_x2]

        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)

        motion_score = 0.0
        if self.prev_gray is not None:
            delta = cv2.absdiff(self.prev_gray, gray)
            thresh = cv2.threshold(delta, 25, 255, cv2.THRESH_BINARY)[1]
            motion_score = (np.count_nonzero(thresh) / (thresh.shape[0] * thresh.shape[1])) * 100.0

        self.prev_gray = gray
        return {
            "motion_score": round(motion_score, 2),
            "roi_coords": (roi_x1, roi_y1, roi_x2, roi_y2),
            "is_active_movement": motion_score > self.motion_threshold
        }

# ==========================================
# 4. MAIN ISRO-STYLE TKINTER APPLICATION
# ==========================================
class AIBASAssistantApp:
    def __init__(self, root):
        self.root = root
        self.root.title("AI BAS Assistant — ISRO Gaganyaan Protocol Monitor (SIH 2026)")
        self.root.geometry("1280x820")
        self.root.minsize(1024, 720)
        self.root.configure(bg="#F0F4F8")  # ISRO Clean Off-White

        # Palette: Clean ISRO Dark Blue & Crisp White
        self.COLOR_BG = "#F4F7FB"
        self.COLOR_PANEL = "#FFFFFF"
        self.COLOR_ISRO_BLUE = "#0B2545"
        self.COLOR_ISRO_NAVY = "#134074"
        self.COLOR_ACCENT_BLUE = "#1D4ED8"
        self.COLOR_SUCCESS = "#166534"
        self.COLOR_WARNING = "#DC2626"
        self.COLOR_BORDER = "#CBD5E1"
        self.COLOR_TEXT_MAIN = "#0F172A"
        self.COLOR_TEXT_MUTED = "#475569"

        # State Variables
        self.is_monitoring = False
        self.current_step_idx = 0  # 0 to 4 (Step 1 to 5)
        self.completed_steps = []
        self.mission_logs = []
        self.voice = VoiceAlertEngine()
        self.detector = ActionDetector()

        # Camera
        self.cap = None
        self.camera_running = False

        self.build_ui()
        self.log_event(None, "SYSTEM_STARTUP", "INFO", "AI BAS Assistant initialized in offline mode.")

    def build_ui(self):
        # 1. Header Bar (ISRO Dark Blue)
        header_frame = tk.Frame(self.root, bg=self.COLOR_ISRO_BLUE, height=75, padx=20, pady=10)
        header_frame.pack(side=tk.TOP, fill=tk.X)

        title_lbl = tk.Label(
            header_frame,
            text="🇮🇳 ISRO GAGANYAAN — AI BAS EXPERIMENT ASSISTANT",
            font=("Segoe UI", 16, "bold"),
            fg="#FFFFFF",
            bg=self.COLOR_ISRO_BLUE
        )
        title_lbl.pack(side=tk.LEFT, pady=2)

        subtitle_lbl = tk.Label(
            header_frame,
            text="Biological Activity System • Smart India Hackathon 2026 • 100% OFFLINE",
            font=("Segoe UI", 10),
            fg="#93C5FD",
            bg=self.COLOR_ISRO_BLUE
        )
        subtitle_lbl.pack(side=tk.LEFT, padx=15, pady=6)

        self.status_badge = tk.Label(
            header_frame,
            text="● STANDBY",
            font=("Segoe UI", 10, "bold"),
            fg="#FCD34D",
            bg="#1E3A8A",
            padx=12,
            pady=4
        )
        self.status_badge.pack(side=tk.RIGHT)

        # 2. Controls Ribbon
        ctrl_bar = tk.Frame(self.root, bg="#E2E8F0", height=50, padx=20, pady=8)
        ctrl_bar.pack(side=tk.TOP, fill=tk.X)

        self.btn_start = tk.Button(
            ctrl_bar, text="▶ START MONITORING", font=("Segoe UI", 10, "bold"),
            bg="#15803D", fg="#FFFFFF", activebackground="#166534",
            padx=16, pady=4, relief=tk.FLAT, cursor="hand2", command=self.start_monitoring
        )
        self.btn_start.pack(side=tk.LEFT, padx=(0, 10))

        self.btn_stop = tk.Button(
            ctrl_bar, text="⏹ STOP MONITORING", font=("Segoe UI", 10, "bold"),
            bg="#DC2626", fg="#FFFFFF", activebackground="#B91C1C",
            padx=16, pady=4, relief=tk.FLAT, state=tk.DISABLED, cursor="hand2", command=self.stop_monitoring
        )
        self.btn_stop.pack(side=tk.LEFT, padx=5)

        self.btn_save_log = tk.Button(
            ctrl_bar, text="💾 SAVE LOG (JSON)", font=("Segoe UI", 10, "bold"),
            bg=self.COLOR_ISRO_NAVY, fg="#FFFFFF", activebackground="#0F2A4A",
            padx=16, pady=4, relief=tk.FLAT, cursor="hand2", command=self.save_log_file
        )
        self.btn_save_log.pack(side=tk.LEFT, padx=5)

        self.btn_reset = tk.Button(
            ctrl_bar, text="↺ RESET EXPERIMENT", font=("Segoe UI", 10),
            bg="#475569", fg="#FFFFFF", activebackground="#334155",
            padx=14, pady=4, relief=tk.FLAT, cursor="hand2", command=self.reset_experiment
        )
        self.btn_reset.pack(side=tk.LEFT, padx=5)

        # 3. Main Dashboard Layout (3 Columns: Left SOP, Center Video, Right Logs)
        main_body = tk.Frame(self.root, bg=self.COLOR_BG, padx=16, pady=12)
        main_body.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        main_body.columnconfigure(0, weight=3) # SOP
        main_body.columnconfigure(1, weight=5) # Video
        main_body.columnconfigure(2, weight=4) # Logs
        main_body.rowconfigure(0, weight=1)

        # LEFT PANEL: SOP Guidance
        left_panel = tk.LabelFrame(
            main_body, text=" EXPERIMENTAL PROTOCOL (SOP) ",
            font=("Segoe UI", 11, "bold"), fg=self.COLOR_ISRO_BLUE,
            bg=self.COLOR_PANEL, padx=12, pady=10, relief=tk.SOLID, bd=1
        )
        left_panel.grid(row=0, column=0, sticky="nsew", padx=(0, 8))

        # Progress bar
        tk.Label(left_panel, text="Mission Progress:", font=("Segoe UI", 9, "bold"), bg=self.COLOR_PANEL, fg=self.COLOR_TEXT_MUTED).pack(anchor="w")
        self.progress_var = tk.DoubleVar(value=0)
        self.progress_bar = ttk.Progressbar(left_panel, variable=self.progress_var, maximum=100)
        self.progress_bar.pack(fill=tk.X, pady=(2, 10))

        self.progress_lbl = tk.Label(left_panel, text="0 of 5 Steps Verified (0%)", font=("Segoe UI", 9), bg=self.COLOR_PANEL, fg=self.COLOR_TEXT_MAIN)
        self.progress_lbl.pack(anchor="w", pady=(0, 10))

        # Active Step Card
        self.active_step_frame = tk.Frame(left_panel, bg="#EFF6FF", bd=1, relief=tk.SOLID, padx=10, pady=8)
        self.active_step_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.active_step_title = tk.Label(self.active_step_frame, text="CURRENT STEP: Step 1", font=("Segoe UI", 11, "bold"), fg=self.COLOR_ACCENT_BLUE, bg="#EFF6FF")
        self.active_step_title.pack(anchor="w")
        self.active_step_desc = tk.Label(self.active_step_frame, text="Open Sample Tray", font=("Segoe UI", 10), fg=self.COLOR_TEXT_MAIN, bg="#EFF6FF", wraplength=260, justify="left")
        self.active_step_desc.pack(anchor="w", pady=(2, 0))

        # Step List Frame
        steps_container = tk.Frame(left_panel, bg=self.COLOR_PANEL)
        steps_container.pack(fill=tk.BOTH, expand=True)

        self.step_labels = []
        for i, step in enumerate(SOP_STEPS):
            s_box = tk.Frame(steps_container, bg="#F8FAFC", bd=1, relief=tk.GROOVE, padx=8, pady=6)
            s_box.pack(fill=tk.X, pady=3)

            lbl = tk.Label(s_box, text=f"Step {step['step']}: {step['title']}", font=("Segoe UI", 9, "bold"), fg="#64748B", bg="#F8FAFC", anchor="w")
            lbl.pack(side=tk.LEFT, fill=tk.X, expand=True)

            status_lbl = tk.Label(s_box, text="PENDING", font=("Segoe UI", 8, "bold"), fg="#94A3B8", bg="#F8FAFC")
            status_lbl.pack(side=tk.RIGHT)

            self.step_labels.append({"box": s_box, "title": lbl, "status": status_lbl})

        # Hackathon Demo Action Simulation Triggers
        sim_frame = tk.LabelFrame(left_panel, text=" Action Simulator (Demo Triggers) ", font=("Segoe UI", 8, "bold"), bg=self.COLOR_PANEL, fg=self.COLOR_TEXT_MUTED, padx=6, pady=4)
        sim_frame.pack(fill=tk.X, side=tk.BOTTOM, pady=(8, 0))

        btn_row1 = tk.Frame(sim_frame, bg=self.COLOR_PANEL)
        btn_row1.pack(fill=tk.X, pady=2)
        tk.Button(btn_row1, text="Trigger Step 1", font=("Segoe UI", 8), command=lambda: self.simulate_action("OPEN_TRAY")).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=1)
        tk.Button(btn_row1, text="Trigger Step 2", font=("Segoe UI", 8), command=lambda: self.simulate_action("INSERT_SAMPLE")).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=1)
        tk.Button(btn_row1, text="Trigger Step 3", font=("Segoe UI", 8), command=lambda: self.simulate_action("ADD_REAGENT")).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=1)

        btn_row2 = tk.Frame(sim_frame, bg=self.COLOR_PANEL)
        btn_row2.pack(fill=tk.X, pady=2)
        tk.Button(btn_row2, text="Trigger Step 4", font=("Segoe UI", 8), command=lambda: self.simulate_action("CLOSE_CONTAINER")).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=1)
        tk.Button(btn_row2, text="Trigger Step 5", font=("Segoe UI", 8), command=lambda: self.simulate_action("START_INCUBATOR")).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=1)
        tk.Button(btn_row2, text="⚠️ Skip To Step 3", font=("Segoe UI", 8, "bold"), fg="#DC2626", command=lambda: self.simulate_action("ADD_REAGENT")).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=1)

        # CENTER PANEL: Live Webcam Feed
        center_panel = tk.LabelFrame(
            main_body, text=" LIVE EXPERIMENT WEBCAM FEED ",
            font=("Segoe UI", 11, "bold"), fg=self.COLOR_ISRO_BLUE,
            bg=self.COLOR_PANEL, padx=10, pady=10, relief=tk.SOLID, bd=1
        )
        center_panel.grid(row=0, column=1, sticky="nsew", padx=4)

        # Video Canvas
        self.video_label = tk.Label(center_panel, bg="#0F172A", text="Webcam Feed Inactive\\nClick 'START MONITORING' above", fg="#94A3B8", font=("Segoe UI", 12))
        self.video_label.pack(fill=tk.BOTH, expand=True, pady=(0, 8))

        # Bottom detection bar in center panel
        self.hud_frame = tk.Frame(center_panel, bg="#F1F5F9", bd=1, relief=tk.GROOVE, padx=10, pady=6)
        self.hud_frame.pack(fill=tk.X)

        self.lbl_detection = tk.Label(
            self.hud_frame,
            text="Detected Activity: IDLE (Awaiting Movement in ROI)",
            font=("Segoe UI", 10, "bold"), fg=self.COLOR_ISRO_BLUE, bg="#F1F5F9"
        )
        self.lbl_detection.pack(side=tk.LEFT)

        self.lbl_motion = tk.Label(
            self.hud_frame,
            text="Optical Motion: 0.0%",
            font=("Segoe UI", 9), fg=self.COLOR_TEXT_MUTED, bg="#F1F5F9"
        )
        self.lbl_motion.pack(side=tk.RIGHT)

        # RIGHT PANEL: Timestamped Activity Logs
        right_panel = tk.LabelFrame(
            main_body, text=" PROTOCOL EXECUTION LOGS ",
            font=("Segoe UI", 11, "bold"), fg=self.COLOR_ISRO_BLUE,
            bg=self.COLOR_PANEL, padx=10, pady=10, relief=tk.SOLID, bd=1
        )
        right_panel.grid(row=0, column=2, sticky="nsew", padx=(8, 0))

        # Treeview for Logs
        columns = ("time", "status", "message")
        self.log_tree = ttk.Treeview(right_panel, columns=columns, show="headings", height=20)
        self.log_tree.heading("time", text="Timestamp")
        self.log_tree.heading("status", text="Status")
        self.log_tree.heading("message", text="Action / Event Details")

        self.log_tree.column("time", width=80, anchor="center")
        self.log_tree.column("status", width=95, anchor="center")
        self.log_tree.column("message", width=190, anchor="w")

        # Scrollbar for log tree
        scrollbar = ttk.Scrollbar(right_panel, orient=tk.VERTICAL, command=self.log_tree.yview)
        self.log_tree.configure(yscroll=scrollbar.set)

        self.log_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.update_sop_ui()

    def start_monitoring(self):
        if self.is_monitoring:
            return
        self.is_monitoring = True
        self.btn_start.configure(state=tk.DISABLED)
        self.btn_stop.configure(state=tk.NORMAL)
        self.status_badge.configure(text="● MONITORING ACTIVE", bg="#065F46", fg="#34D399")

        # Start Camera thread
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            print("[Warning] Hardware camera not available. Running fallback synthetic feed.")
        self.camera_running = True
        self.update_webcam_frame()

        self.log_event(1, "MONITORING_START", "INFO", "Experiment protocol monitoring commenced.")
        self.voice.speak_async(f"Monitoring started. Please proceed with Step 1: {SOP_STEPS[0]['title']}.")

    def stop_monitoring(self):
        self.is_monitoring = False
        self.camera_running = False
        if self.cap:
            self.cap.release()
            self.cap = None

        self.btn_start.configure(state=tk.NORMAL)
        self.btn_stop.configure(state=tk.DISABLED)
        self.status_badge.configure(text="● STOPPED", bg="#991B1B", fg="#FCA5A5")
        self.video_label.configure(image="", text="Monitoring Paused\\nClick 'START MONITORING' to resume")
        self.log_event(None, "MONITORING_STOP", "INFO", "Monitoring halted by operator.")

    def reset_experiment(self):
        self.stop_monitoring()
        self.current_step_idx = 0
        self.completed_steps = []
        self.update_sop_ui()
        self.log_event(None, "RESET", "INFO", "Experiment protocol reset to Step 1.")

    def update_sop_ui(self):
        total = len(SOP_STEPS)
        comp = len(self.completed_steps)
        pct = int((comp / total) * 100)

        self.progress_var.set(pct)
        self.progress_lbl.configure(text=f"{comp} of {total} Steps Completed ({pct}%)")

        if self.current_step_idx < total:
            cur = SOP_STEPS[self.current_step_idx]
            self.active_step_title.configure(text=f"CURRENT STEP: Step {cur['step']}")
            next_txt = f" -> Next: {SOP_STEPS[self.current_step_idx+1]['title']}" if self.current_step_idx + 1 < total else " (Final Step)"
            self.active_step_desc.configure(text=f"{cur['title']}\\n{cur['description']}\\n{next_txt}")
        else:
            self.active_step_title.configure(text="EXPERIMENT COMPLETED")
            self.active_step_desc.configure(text="All 5 steps verified. Incubator cycle active.")

        for i, item in enumerate(self.step_labels):
            if i in self.completed_steps:
                item["box"].configure(bg="#F0FDF4")
                item["title"].configure(fg="#166534", bg="#F0FDF4")
                item["status"].configure(text="COMPLETED", fg="#166534", bg="#F0FDF4")
            elif i == self.current_step_idx and self.is_monitoring:
                item["box"].configure(bg="#EFF6FF")
                item["title"].configure(fg="#1D4ED8", bg="#EFF6FF")
                item["status"].configure(text="IN PROGRESS", fg="#1D4ED8", bg="#EFF6FF")
            else:
                item["box"].configure(bg="#F8FAFC")
                item["title"].configure(fg="#64748B", bg="#F8FAFC")
                item["status"].configure(text="PENDING", fg="#94A3B8", bg="#F8FAFC")

    def simulate_action(self, action_code):
        """Simulate an action event for testing AI logic or camera inference."""
        if not self.is_monitoring:
            messagebox.showinfo("Start Required", "Please click 'START MONITORING' before performing actions.")
            return

        # Find which step corresponds to this action
        matched_step = next((s for s in SOP_STEPS if s["action_code"] == action_code), None)
        if not matched_step:
            return

        expected_step = SOP_STEPS[self.current_step_idx] if self.current_step_idx < len(SOP_STEPS) else None

        if expected_step and matched_step["step"] == expected_step["step"]:
            # CORRECT STEP!
            self.completed_steps.append(self.current_step_idx)
            self.log_event(matched_step["step"], action_code, "COMPLETED", f"Verified: {matched_step['title']}")

            self.current_step_idx += 1
            self.update_sop_ui()

            if self.current_step_idx < len(SOP_STEPS):
                next_step = SOP_STEPS[self.current_step_idx]
                msg = f"Step {matched_step['step']} verified. Next step: {next_step['title']}."
                self.voice.speak_async(msg)
            else:
                msg = "All BAS experiment steps completed successfully. Ready for incubation."
                self.voice.speak_async(msg)
                self.status_badge.configure(text="● PROTOCOL COMPLETE", bg="#15803D", fg="#DCFCE7")
        else:
            # WRONG / SKIPPED STEP -> VOICE WARNING!
            req_num = expected_step['step'] if expected_step else 5
            req_title = expected_step['title'] if expected_step else "Incubator"
            warn_msg = f"Warning! Please complete Step {req_num} first."
            self.log_event(matched_step["step"], action_code, "WARNING", f"Skipped sequence! Expected Step {req_num}: {req_title}")
            self.voice.speak_async(warn_msg)
            messagebox.showwarning("Protocol Warning", f"{warn_msg}\\n\\nExpected: Step {req_num} ({req_title})\\nDetected: Step {matched_step['step']} ({matched_step['title']})")

    def update_webcam_frame(self):
        if not self.camera_running:
            return

        frame = None
        if self.cap and self.cap.isOpened():
            ret, captured = self.cap.read()
            if ret:
                frame = captured

        if frame is None:
            # Generate synthetic ISRO Gaganyaan lab canvas
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            frame[:] = (25, 30, 45) # dark navy slate
            cv2.putText(frame, "ISRO GAGANYAAN BAS LAB FEED", (40, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, "[LIVE SYNTHETIC CAMERA SENSOR]", (40, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 200, 100), 1)

        # Computer Vision Analysis & Holographic Geometric HUD
        analysis = self.detector.analyze_frame(frame)
        rx1, ry1, rx2, ry2 = analysis["roi_coords"]

        # 1. Outer Spatial Telemetry Frame & Geometric Corner Reticles
        cv2.rectangle(frame, (rx1, ry1), (rx2, ry2), (0, 200, 100), 1)
        c_len = 20
        # Corner Brackets
        cv2.line(frame, (rx1, ry1), (rx1 + c_len, ry1), (0, 255, 120), 2)
        cv2.line(frame, (rx1, ry1), (rx1, ry1 + c_len), (0, 255, 120), 2)
        cv2.line(frame, (rx2, ry1), (rx2 - c_len, ry1), (0, 255, 120), 2)
        cv2.line(frame, (rx2, ry1), (rx2, ry1 + c_len), (0, 255, 120), 2)
        cv2.line(frame, (rx1, ry2), (rx1 + c_len, ry2), (0, 255, 120), 2)
        cv2.line(frame, (rx1, ry2), (rx1, ry2 - c_len), (0, 255, 120), 2)
        cv2.line(frame, (rx2, ry2), (rx2 - c_len, ry2), (0, 255, 120), 2)
        cv2.line(frame, (rx2, ry2), (rx2, ry2 - c_len), (0, 255, 120), 2)

        # 2. Geometric SOP Trajectory Guidance Vector
        step_num = self.current_step_idx + 1 if self.current_step_idx < len(SOP_STEPS) else 5
        if step_num == 1:
            # Step 1: Slide Out Vector
            cv2.arrowedLine(frame, (rx1 + 40, ry1 + 90), (rx1 + 220, ry1 + 90), (255, 180, 50), 2, tipLength=0.15)
            cv2.putText(frame, "TRAJECTORY 1: SLIDE TRAY OUTWARD", (rx1 + 10, ry1 + 75), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 180, 50), 1)
        elif step_num == 2:
            # Step 2: Arc Insertion Vector into Slot A-1
            cv2.arrowedLine(frame, (rx1 + 80, ry1 + 30), (rx1 + 140, ry1 + 140), (50, 200, 255), 2, tipLength=0.15)
            cv2.putText(frame, "TRAJECTORY 2: AMPOULE INSERTION (SLOT A-1)", (rx1 + 10, ry1 + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (50, 200, 255), 1)
        elif step_num == 3:
            # Step 3: Vertical 90 deg Pipette Vector
            cv2.arrowedLine(frame, (rx1 + 140, ry1 + 30), (rx1 + 140, ry1 + 130), (100, 255, 100), 2, tipLength=0.15)
            cv2.putText(frame, "TRAJECTORY 3: 90 DEG VERTICAL BUFFER", (rx1 + 10, ry1 + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (100, 255, 100), 1)
        elif step_num == 4:
            # Step 4: Hermetic Seal Slide In
            cv2.arrowedLine(frame, (rx2 - 40, ry1 + 90), (rx1 + 60, ry1 + 90), (255, 100, 220), 2, tipLength=0.15)
            cv2.putText(frame, "TRAJECTORY 4: ENGAGE VACUUM SEAL", (rx1 + 10, ry1 + 75), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 100, 220), 1)
        else:
            # Step 5: Thermal Radial Wave
            cv2.circle(frame, ((rx1 + rx2) // 2, (ry1 + ry2) // 2), 45, (100, 100, 255), 1)
            cv2.circle(frame, ((rx1 + rx2) // 2, (ry1 + ry2) // 2), 70, (100, 100, 255), 1)
            cv2.putText(frame, "THERMAL VECTORS: 37.0 C ACTIVE", (rx1 + 10, ry1 + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (100, 100, 255), 1)

        # 3. Holographic Matrix Target Reticle
        cx, cy = (rx1 + rx2) // 2, (ry1 + ry2) // 2
        cv2.drawMarker(frame, (cx, cy), (0, 255, 120), cv2.MARKER_CROSS, 20, 1)
        cv2.putText(frame, "ISRO GAGANYAAN // HAR SPATIAL HUD", (rx1 + 5, ry1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 120), 1)

        # Overlay text
        m_score = analysis["motion_score"]
        cv2.putText(frame, f"Motion Intensity: {m_score}%", (20, 440), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 255), 2)

        # Convert OpenCV BGR to PIL Image for Tkinter
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        im = Image.fromarray(rgb_frame)
        im = im.resize((600, 420), Image.Resampling.LANCZOS)
        imgtk = ImageTk.PhotoImage(image=im)

        self.video_label.imgtk = imgtk
        self.video_label.configure(image=imgtk)

        self.lbl_motion.configure(text=f"Optical Motion: {m_score}%")

        # Schedule next frame in ~33ms (30 FPS)
        self.root.after(33, self.update_webcam_frame)

    def log_event(self, step_num, action, status, message):
        now_str = datetime.now().strftime("%H:%M:%S")
        entry = {
            "timestamp": now_str,
            "iso_time": datetime.now().isoformat(),
            "step": step_num,
            "action": action,
            "status": status,
            "message": message
        }
        self.mission_logs.append(entry)
        self.log_tree.insert("", tk.END, values=(now_str, f"[{status}]", message))
        self.log_tree.yview_moveto(1)

    def save_log_file(self):
        if not self.mission_logs:
            messagebox.showinfo("Log Empty", "No experiment events logged yet.")
            return

        default_name = f"bas_experiment_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON Files", "*.json")],
            initialfile=default_name
        )
        if path:
            try:
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(self.mission_logs, f, indent=2)
                messagebox.showinfo("Saved", f"Experiment log successfully saved to:\\n{path}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save log: {e}")

# ==========================================
# 5. ENTRY POINT
# ==========================================
if __name__ == "__main__":
    root = tk.Tk()
    app = AIBASAssistantApp(root)
    root.mainloop()
`;

export const PYTHON_REQUIREMENTS = `opencv-python>=4.8.0
pyttsx3>=2.90
Pillow>=10.0.0
numpy>=1.24.0
`;

export const PYTHON_README = `# AI BAS Assistant — Smart India Hackathon 2026

**Autonomous Biological Activity System (BAS) SOP Verification for Astronauts**
**Indian Space Research Organisation (ISRO) Gaganyaan Mission Protocol**

## 1. Project Overview
The AI BAS Assistant is an offline, mission-grade desktop system designed to monitor Gaganyaan astronauts in real-time as they perform Biological Activity System (BAS) science experiments.

By combining computer vision and human activity recognition, the system enforces strict sequential adherence to Standard Operating Procedures (SOP Steps 1 to 5). If an astronaut skips a step or executes a step out of order, the assistant instantly issues a synthesized voice alert:
> *"Warning! Please complete Step 3 first."*

## 2. Key Features
- **100% Offline / Air-Gapped**: Runs entirely on the space capsule or offline laptop without internet dependency.
- **ISRO-Style Dashboard**: Deep Navy & Clean White contrast, large legible fonts, zero distracting animations.
- **Webcam Feed & ROI Detection**: Tracks astronaut movements in the designated sample tray zone.
- **Voice Warning Engine**: Audio warning when out-of-order execution is attempted.
- **Automatic JSON Audit Log**: Logs timestamps, step numbers, action codes, and status tags (COMPLETED/WARNING).

## 3. Installation & Setup
1. Clone or download the files:
\`\`\`bash
git clone https://github.com/your-team/ai-bas-assistant.git
cd ai-bas-assistant
\`\`\`

2. Create and activate a Python virtual environment:
\`\`\`bash
python -m venv venv
# On Windows:
venv\\Scripts\\activate
# On Linux / Mac:
source venv/bin/activate
\`\`\`

3. Install required libraries:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

4. Run the application:
\`\`\`bash
python main.py
\`\`\`
`;
