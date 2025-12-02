// 1️⃣ Lottie Animations
document.querySelectorAll('.lottie-hero, .feature-lottie').forEach(el => {
  const src = el.dataset.src;
  if(src){
    lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: src
    });
  }
});

// 2️⃣ Counters
document.querySelectorAll('.counter').forEach(counter => {
  const updateCount = () => {
    const target = +counter.dataset.target;
    const count = +counter.innerText;
    const increment = target / 200;
    if(count < target){
      counter.innerText = Math.ceil(count + increment);
      setTimeout(updateCount, 10);
    } else { counter.innerText = target; }
  };
  updateCount();
});

// 3️⃣ Modal Open/Close & Tabs
const modal = document.getElementById('modal');
const backdrop = document.getElementById('backdrop');
document.getElementById('btnLogin').addEventListener('click', () => modal.hidden = false);
document.getElementById('modalClose').addEventListener('click', () => modal.hidden = true);
backdrop.addEventListener('click', () => modal.hidden = true);

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
    document.getElementById(tab.dataset.tab).classList.remove('hidden');
  });
});

// 4️⃣ AI Chat Widget
const aiPanel = document.getElementById('aiPanel');
document.getElementById('aiToggle').addEventListener('click', () => aiPanel.hidden = !aiPanel.hidden);
document.getElementById('aiClose').addEventListener('click', () => aiPanel.hidden = true);

document.getElementById('aiForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('aiInput').value.trim();
  if(input){
    const messages = document.getElementById('aiMessages');
    messages.innerHTML += `<div class="user-msg">You: ${input}</div>`;
    messages.innerHTML += `<div class="bot-msg">MentorMuni: Our team will contact you soon!</div>`;
    document.getElementById('aiInput').value = '';
    messages.scrollTop = messages.scrollHeight;
  }
});

// 5️⃣ Forms (dummy alert for now)
document.getElementById('enrollForm').addEventListener('submit', e => {
  e.preventDefault();
  alert("Enrollment submitted! Payment link will be sent via WhatsApp.");
});
document.getElementById('studentLogin').addEventListener('submit', e => {
  e.preventDefault();
  alert("Student info submitted!");
});
document.getElementById('mentorLogin').addEventListener('submit', e => {
  e.preventDefault();
  alert("Mentor login submitted!");
});

// 6️⃣ Footer Year
document.getElementById('yearJS').innerText = new Date().getFullYear();

// 7️⃣ Initialize AOS
AOS.init({ duration: 800, once: true });
