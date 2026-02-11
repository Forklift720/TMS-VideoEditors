# luncher.py
# UI launcher (black background):
# - dropdown has 1 option: "Putin has a BIG problem."
# - GO launches Premiere + opens project: ./source/proj/putin has a big problem.prproj
# - shows a 40s countdown + progress bar
# - hides the extra empty console window on Windows

import os
import sys
import subprocess
import tkinter as tk
from tkinter import messagebox

# Optional: force-launch Premiere via exe instead of file association.
# PREMIERE_EXE = r"C:\Program Files\Adobe\Adobe Premiere Pro 2025\Adobe Premiere Pro.exe"
PREMIERE_EXE = ""  # leave empty to use OS default "open project file"

COUNTDOWN_SECONDS = 10
OPTION_TEXT = "Putin has a BIG problem."


def hide_console_window_windows():
    """Hide the console window (the 'small empty window') on Windows."""
    if not sys.platform.startswith("win"):
        return
    try:
        import ctypes
        hwnd = ctypes.windll.kernel32.GetConsoleWindow()
        if hwnd:
            ctypes.windll.user32.ShowWindow(hwnd, 0)  # SW_HIDE = 0
            ctypes.windll.kernel32.CloseHandle(hwnd)
    except Exception:
        pass


def script_dir() -> str:
    return os.path.dirname(os.path.abspath(__file__))


def project_path() -> str:
    # Relative to luncher.py: ./source/proj/putin has a big problem.prproj
    return os.path.join(script_dir(), "source", "proj", "putin has a big problem.prproj")


def launch_premiere_with_project(prproj: str) -> None:
    if PREMIERE_EXE:
        exe = os.path.expandvars(PREMIERE_EXE)
        if not os.path.isfile(exe):
            raise FileNotFoundError(f"PREMIERE_EXE not found:\n{exe}")
        subprocess.Popen([exe, prproj], close_fds=True)
        return

    if sys.platform.startswith("win"):
        os.startfile(prproj)  # type: ignore[attr-defined]
    elif sys.platform == "darwin":
        subprocess.Popen(["open", prproj], close_fds=True)
    else:
        subprocess.Popen(["xdg-open", prproj], close_fds=True)


class LauncherUI(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("Launcher")
        self.resizable(False, False)
        self.geometry("520x190")
        self.configure(bg="black")

        self.selected = tk.StringVar(value=OPTION_TEXT)

        # --- layout ---
        padx = 14

        lbl = tk.Label(self, text="Select:", bg="black", fg="white", font=("Segoe UI", 11))
        lbl.pack(anchor="w", padx=padx, pady=(12, 6))

        row = tk.Frame(self, bg="black")
        row.pack(fill="x", padx=padx)

        # Dropdown (single option)
        self.dropdown = tk.OptionMenu(row, self.selected, OPTION_TEXT)
        self.dropdown.configure(
            bg="#111111",
            fg="white",
            activebackground="#222222",
            activeforeground="white",
            highlightthickness=0,
            relief="solid",
            bd=1,
            font=("Segoe UI", 10),
        )
        # Style the internal menu (best-effort; some platforms ignore parts)
        try:
            menu = self.dropdown["menu"]
            menu.configure(bg="#111111", fg="white", activebackground="#222222", activeforeground="white")
        except Exception:
            pass

        self.dropdown.pack(side="left", fill="x", expand=True)

        self.go_btn = tk.Button(
            row,
            text="GO",
            command=self.on_go,
            bg="#222222",
            fg="white",
            activebackground="#333333",
            activeforeground="white",
            relief="solid",
            bd=1,
            font=("Segoe UI", 10, "bold"),
            padx=14,
            pady=6,
        )
        self.go_btn.pack(side="left", padx=(10, 0))

        self.status = tk.Label(self, text="Idle.", bg="black", fg="white", font=("Segoe UI", 10))
        self.status.pack(anchor="w", padx=padx, pady=(14, 4))

        # Canvas progress bar (so we can fully control colors on black bg)
        self.bar_w = 480
        self.bar_h = 16
        self.progress_canvas = tk.Canvas(
            self, width=self.bar_w, height=self.bar_h, bg="black", highlightthickness=1, highlightbackground="#444444"
        )
        self.progress_canvas.pack(padx=padx, pady=(6, 0))

        self._fill_rect = self.progress_canvas.create_rectangle(0, 0, 0, self.bar_h, fill="white", width=0)

        self._ticks_remaining = 0
        self._running = False

    def on_go(self):
        if self._running:
            return

        prproj = project_path()
        if not os.path.isfile(prproj):
            messagebox.showerror(
                "Project not found",
                f"Could not find Premiere project:\n{prproj}\n\n"
                f"Expected relative to luncher.py:\n./source/proj/putin has a big problem.prproj",
            )
            return

        try:
            launch_premiere_with_project(prproj)
        except Exception as e:
            messagebox.showerror("Launch failed", str(e))
            return

        # Start 40s countdown/progress
        self._running = True
        self.go_btn.config(state="disabled")
        self._ticks_remaining = COUNTDOWN_SECONDS * 10  # 0.1s ticks
        self._set_progress(0)
        self.status.config(text=f"Launched Premiere. Waiting {COUNTDOWN_SECONDS}s...")
        self.after(100, self._tick)

    def _set_progress(self, fraction_0_to_1: float):
        fraction_0_to_1 = max(0.0, min(1.0, fraction_0_to_1))
        w = int(self.bar_w * fraction_0_to_1)

    def _tick(self):
        if self._ticks_remaining <= 0:
            self._running = False
            self.go_btn.config(state="normal")
            self.status.config(text="Done waiting. (Premiere should be open.)")
            self._set_progress(1.0)
            return

        total_ticks = COUNTDOWN_SECONDS * 10
        elapsed_ticks = total_ticks - self._ticks_remaining
        self._set_progress(elapsed_ticks / float(total_ticks))

        secs_left = (self._ticks_remaining + 9) // 10
        self.status.config(text=f"Launched Premiere. Waiting {secs_left}s...")

        self._ticks_remaining -= 1
        self.after(100, self._tick)


if __name__ == "__main__":
    hide_console_window_windows()
    app = LauncherUI()
    app.mainloop()
