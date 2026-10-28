import { useEffect, useRef, useState } from "react";

/* ====== IMPORT HÌNH ẢNH TỪ SRC/ASSETS ====== */

import avatarImg from "./assets/avatar.png";
import starImg from "./assets/star.png";
import caro from "./assets/caroHeaderElement.png";
import caro2 from "./assets/caroHeaderElement2.png";
import underlineImg from "./assets/xac nhan tham du underline.png";

/* ====== CONFIG THÔNG TIN BUỔI LỄ ====== */

const CONFIG = {
  firstLine: "Lê Cao",
  lastLine: "Kha",
  date: "2026-11-07T16:00:00+07:00",
  venue: "Sân trường Đại học FPT TPHCM",
  address:
    "Lô E2a-7, Đường D1, Khu Công nghệ cao, Phường Tăng Nhơn Phú, TP. Hồ Chí Minh",
  mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=",
  phone: "0764770586",
  facebook: "Cao Kha",
};

/* ====== GOOGLE SHEETS CONFIG ====== */

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw8aS2hKL_S5NGj6I2sfA6M9HBsy4BFngGiFzCDqWHzAYLDp3aWVQMxtMppUg-iXz6MTg/exec";

/* ====== DATE FORMAT ====== */

const TZ = "Asia/Ho_Chi_Minh";

const eventDate = new Date(CONFIG.date);

const fmt = (opts) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: TZ,
    ...opts,
  }).format(eventDate);

const DAY = fmt({
  day: "numeric",
  month: "long",
  year: "numeric",
});

const WEEKDAY = fmt({ weekday: "long" });

const TIME = fmt({
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/* ====== STATIC CALENDAR ====== */

function Calendar() {
  // Lấy ngày tổ chức từ CONFIG
  const [year, eventMonth, eventDay] = CONFIG.date
    .slice(0, 10)
    .split("-")
    .map(Number);

  // JavaScript sử dụng tháng từ 0 đến 11
  const month = eventMonth - 1;

  // Xác định thứ của ngày đầu tiên trong tháng
  const firstDay = new Date(year, month, 1).getDay();

  // Quy đổi để tuần bắt đầu từ thứ Hai
  const offset = (firstDay + 6) % 7;

  // Tổng số ngày trong tháng
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Tạo danh sách ngày
  const days = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="w-full font-quick">
      {/* Month / Year - Static */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold text-gray-500">
          Tháng {eventMonth}
        </span>

        <span className="text-sm font-bold text-gray-500">{year}</span>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 text-center mb-0">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
          <div key={day} className="text-xs font-bold text-gray-700 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 text-center gap-y-1">
        {days.map((day, index) => {
          const isEvent = day === eventDay;

          return (
            <div key={index} className="h-9 flex items-center justify-center">
              {day !== null && (
                <span
                  className={`
                    w-10 h-10
                    flex items-center justify-center
                    rounded-lg text-base
                    ${
                      isEvent
                        ? "bg-[#FBE264] text-black font-bold"
                        : "text-gray-800"
                    }
                  `}
                >
                  {day}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ====== REVEAL ANIMATION ====== */

function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    io.observe(el);

    return () => io.disconnect();
  }, []);

  return [ref, shown];
}

function Reveal({
  as: Tag = "div",
  delay = 0,
  className = "",
  children,
  ...rest
}) {
  const [ref, shown] = useReveal();

  return (
    <Tag
      ref={ref}
      data-in={shown}
      style={{ "--d": `${delay}ms` }}
      className={`
        opacity-0 translate-y-5
        transition-all duration-700 ease-out
        data-[in=true]:opacity-100
        data-[in=true]:translate-y-0
        [transition-delay:var(--d,0ms)]
        ${className}
      `}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ====== MAIN APP ====== */

const App = () => {
  const params = new URLSearchParams(window.location.search);

  const tenKhach = (params.get("tenkhach") || "").trim().slice(0, 40);

  const xung = (params.get("xung") || "tui").trim().slice(0, 20) || "tui";

  const invitationText = tenKhach
    ? `Thân mời ${tenKhach} đến tham dự lễ tốt nghiệp của ${xung}`
    : "Thân mời bạn đến tham dự lễ tốt nghiệp của tui";

  /* ====== RSVP STATE ====== */

  const [rsvpName, setRsvpName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const submittingRef = useRef(false);

  /* ====== GOOGLE MAPS ====== */

  const mapsHref =
    CONFIG.mapsUrl + encodeURIComponent(`${CONFIG.venue}, ${CONFIG.address}`);

  /* ====== GOOGLE SHEETS SUBMIT ====== */

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();

    const name = rsvpName.trim();

    // Không cho phép gửi tên trống hoặc gửi liên tục
    if (!name || submittingRef.current || submitted) {
      return;
    }

    submittingRef.current = true;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Chuẩn bị dữ liệu gửi đến Google Apps Script
      const formData = new URLSearchParams();

      formData.append("name", name);

      // Gửi dữ liệu
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      // no-cors không cho phép đọc phản hồi từ Apps Script.
      // Trạng thái này chỉ cho biết yêu cầu đã được gửi đi.
      setSubmitted(true);
    } catch (error) {
      console.error("Lỗi gửi thông tin RSVP:", error);

      setSubmitError(
        "Không thể gửi yêu cầu. Vui lòng kiểm tra kết nối và thử lại.",
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#1c1c1c] py-6 px-3 flex justify-center items-start font-['Quicksand',sans-serif] antialiased text-black">
      {" "}
      {/* Google Fonts Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=League+Gothic&family=Luxurious+Script&family=Oswald:wght@500;600&family=Quicksand:wght@400;500;600;700&display=swap');

        .font-script {
          font-family: 'Luxurious Script', cursive;
        }

        .font-league {
          font-family: 'League Gothic', sans-serif;
          letter-spacing: 0.01em;
        }

        .font-oswald {
          font-family: 'Oswald', sans-serif;
        }

        .font-quick {
          font-family: 'Quicksand', sans-serif;
        }
          
        /* ====== MOBILE RESPONSIVE ====== */

        @media (max-width: 480px) {

          html,
          body,
          #root {
            width: 100%;
            max-width: 100%;
            margin: 0;
          }

          *,
          *::before,
          *::after {
            box-sizing: border-box;
          }

          img {
            max-width: 100%;
          }

        }

      `}</style>
      {/* KHUNG THIỆP CHÍNH Ở GIỮA */}
      <main className="w-full min-w-0 max-w-[470px] bg-white shadow-2xl relative overflow-hidden py-10 flex flex-col items-center">
        {/* 1. Graduation Ceremony Header */}
        <Reveal className="relative mt-2">
          <h1 className="relative z-10 font-league text-[clamp(2.5rem,11vw,3.75rem)] text-black tracking-wider whitespace-nowrap">
            Graduation Ceremony
          </h1>

          <div>
            <img
              src={starImg}
              alt="star"
              className="absolute w-9 top-[-20px] right-[-30px] rotate-[45deg]"
            />

            <img
              src={starImg}
              alt="star"
              className="absolute w-9 top-[-25px] left-[-30px]"
            />
          </div>

          <div className="absolute z-0 bottom-[3px] left-1/2 -translate-x-1/2 bg-[#FBE264] w-[108%] rounded-[20px] h-3"></div>
        </Reveal>

        {/* 2. Avatar Tròn viền vàng #FBE264 */}
        <Reveal
          delay={100}
          className="flex justify-between items-center w-full mt-11"
        >
          <div>
            <img src={caro} alt="caro" className="w-23 object-contain" />
          </div>

          <div className="w-40 h-40 rounded-full p-1 border-5 border-[#FBE264] bg-[#FBE264]/20 overflow-hidden flex items-center justify-center">
            <img
              src={avatarImg}
              alt="Avatar"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div>
            <img src={caro2} alt="caro2" className="w-23 object-contain" />
          </div>
        </Reveal>

        {/* 3. Tên chính: Lê Cao Kha */}
        <Reveal delay={150} className="mt-4 text-center">
          <h2 className="font-script text-5xl text-black">
            <span>Lê</span>
            <span className="inline-block ml-4">Cao Kha</span>
          </h2>
        </Reveal>

        {/* 4. Lời mời */}
        <Reveal delay={200} className="mt-5 mx-10 text-center px-10">
          <p className="font-quick text-lg font-light text-gray-700 italic">
            &ldquo;Thân mời{" "}
            {tenKhach ? (
              <span className="text-[#E86E23]">{tenKhach}</span>
            ) : (
              "bạn"
            )}{" "}
            đến tham dự lễ tốt nghiệp của {tenKhach ? xung : "tui"}&rdquo;
          </p>
        </Reveal>

        {/* 5. Thanh Tiêu Đề Thời Gian | Địa Điểm */}
        <Reveal
          delay={250}
          className="w-[60%] mt-8 flex rounded-xl overflow-hidden shadow-sm pointer-events-none"
        >
          <div className="flex-1 py-3 bg-[#FBE264] text-black font-league text-4xl tracking-wider text-center">
            <span className="inline-block scale-y-[1.2]">Thời Gian</span>
          </div>

          <div className="flex-1 py-3 bg-black text-[#FBE264] font-league text-4xl tracking-wider text-center">
            <span className="inline-block scale-y-[1.2]">Địa Điểm</span>
          </div>
        </Reveal>

        {/* Thông tin Thời gian hiển thị */}
        <Reveal delay={280} className="px-7 w-full mt-10 space-y-4">
          <div className="font-quick text-md font-semibold text-gray-800 text-center">
            Thời gian:{" "}
            <span className="font-normal text-gray-600">
              {WEEKDAY}, ngày {DAY} ({TIME})
            </span>
          </div>

          {/* Box Lịch / Static Calendar */}
          <div className="w-full border-2 border-[#FBE264] rounded-2xl p-6 bg-white shadow-sm flex flex-col items-center justify-center min-h-[160px]">
            <Calendar />
          </div>
        </Reveal>

        {/* 6. Địa chỉ tĩnh */}
        <Reveal delay={300} className="mt-5 text-center px-20">
          <p className="font-quick text-sm text-gray-600 leading-relaxed">
            <strong className="text-black font-semibold">Địa Điểm:</strong>{" "}
            {CONFIG.venue}, {CONFIG.address}
          </p>
        </Reveal>

        {/* 7. Nút Xem Đường Đi (Font Oswald) */}
        <Reveal delay={350} className="w-[45%] mt-8">
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block py-3 text-center bg-[#FBE264] hover:bg-[#f6d744] text-black font-oswald text-lg tracking-wider rounded-xl shadow-md transition-all active:scale-95"
          >
            Xem Đường Đi
          </a>
        </Reveal>

        {/* 8. Thông tin liên hệ Box */}
        <Reveal
          delay={400}
          className="w-[60%] mt-10 border border-[#FBE264] rounded-2xl p-4 bg-white shadow-xs text-center space-y-1"
        >
          <p className="font-quick text-sm font-bold uppercase tracking-wide text-black">
            Thông tin liên hệ
          </p>

          <p className="font-quick text-sm mt-3 text-gray-700">
            SĐT: <span className="font-bold">{CONFIG.phone}</span>
          </p>

          <p className="font-quick text-sm text-gray-700">
            Facebook:{" "}
            <a
              href="https://www.facebook.com/cao.kha.202437"
              className="text-blue-600 underline"
            >
              {CONFIG.facebook}
            </a>
          </p>
        </Reveal>

        {/* 9. Xác Nhận Tham Dự (RSVP) */}
        <Reveal delay={450} className="w-full mt-15 text-center">
          <h3 className="font-league text-5xl text-[#E86E23] uppercase tracking-wide">
            Xác Nhận Tham Dự
          </h3>

          <div className="flex justify-center mt-1">
            <img
              src={underlineImg}
              alt="underline"
              className="w-80 object-contain"
            />
          </div>

          {/* RSVP FORM */}

          {submitted ? (
            /* Thông báo sau khi gửi yêu cầu */
            <div className="mx-10 mt-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-quick rounded-xl">
              Cảm ơn bạn! Yêu cầu xác nhận đã được gửi.
            </div>
          ) : (
            <form onSubmit={handleRsvpSubmit} className="px-15 mt-8 space-y-3">
              {/* Nhập tên khách mời */}
              <input
                type="text"
                placeholder="Nhập tên của bạn"
                value={rsvpName}
                onChange={(e) => setRsvpName(e.target.value)}
                className="w-full px-4 py-2.5 mb-3 rounded-full border border-[#E86E23]/60 focus:outline-none focus:border-[#E86E23] font-quick text-sm shadow-inner"
                required
                maxLength={100}
                disabled={isSubmitting}
              />

              {/* Thông báo lỗi */}
              {submitError && (
                <p className="text-red-500 text-xs font-quick">{submitError}</p>
              )}

              {/* Nút gửi dữ liệu đến Google Sheets */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#E86E23] hover:bg-[#d55e1c] text-white font-league text-xl tracking-wider rounded-full shadow-md transition-all active:scale-95"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi Ngay"}
              </button>
            </form>
          )}
        </Reveal>

        {/* 10. Thank You! (Luxurious Script) */}
        <Reveal delay={500} className="mt-8 text-center">
          <h2 className="font-script text-7xl text-black">Thank You !</h2>
        </Reveal>
      </main>
    </div>
  );
};

export default App;
