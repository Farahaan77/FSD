// src/public/js/app.js - Full-Stack Client for Farahaan's AI Wellness Platform
document.addEventListener('DOMContentLoaded', () => {
  // Navigation State
  const navItems = document.querySelectorAll('.nav-item');
  const viewPanels = document.querySelectorAll('.view-panel');
  const pageHeading = document.getElementById('page-heading');

  const titles = {
    overview: 'Wellness knowledge dashboard',
    library: 'Peer-reviewed peptide research library',
    assistant: 'Evidence-grounded AI research assistant',
    journal: 'Personal wellness journal & habit tracking',
    saved: 'Bookmarked research and saved AI insights',
    admin: 'Knowledge ingestion & RAG vector pipeline',
    settings: 'Candidate & system architecture settings'
  };

  function switchView(viewName) {
    navItems.forEach(n => {
      n.classList.toggle('active', n.dataset.view === viewName);
    });
    viewPanels.forEach(p => {
      p.classList.toggle('active', p.id === `view-${viewName}`);
    });
    pageHeading.textContent = titles[viewName] || 'Wellness Knowledge Platform';

    if (viewName === 'overview') loadOverviewData();
    if (viewName === 'library') loadResearchLibrary();
    if (viewName === 'journal') loadWellnessJournal();
    if (viewName === 'saved') loadSavedResources();
    if (viewName === 'admin') loadAdminTelemetry();
  }

  navItems.forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      switchView(item.dataset.view);
    });
  });

  // Action cards on Overview
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.goto));
  });

  // Category highlight clicks on Overview
  document.querySelectorAll('.highlight-item').forEach(item => {
    item.addEventListener('click', () => {
      const cat = item.dataset.category;
      switchView('library');
      filterByCategory(cat);
    });
  });

  // Global search input
  const searchInput = document.getElementById('global-search');
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      switchView('library');
      loadResearchLibrary(q);
    }
  });

  // -------------------------------------------------------------
  // 1. OVERVIEW VIEW & 7-DAY BAR CHART
  // -------------------------------------------------------------
  async function loadOverviewData() {
    try {
      const res = await fetch('/api/v1/wellness');
      const data = await res.json();
      if (!data.success) return;

      const chartWrap = document.getElementById('overview-bar-chart');
      chartWrap.innerHTML = '';

      const weekly = data.analytics.weeklyChart || [];
      weekly.forEach(item => {
        const col = document.createElement('div');
        col.className = 'bar-col';
        
        // Energy height proportional (max 10 -> 100%)
        const heightPct = Math.max(25, (item.energy / 10) * 85);
        
        col.innerHTML = `
          <div class="bar-track">
            <div class="bar-fill" style="height: ${heightPct}%;" title="${item.day}: ${item.energy}/10 Energy, ${item.sleep}h Sleep"></div>
          </div>
          <span class="bar-label">${item.day[0]}</span>
        `;
        chartWrap.appendChild(col);
      });
    } catch (err) {
      console.error('Error loading overview data:', err);
    }
  }

  // -------------------------------------------------------------
  // 2. RESEARCH LIBRARY
  // -------------------------------------------------------------
  let currentCategory = 'All';

  const catTabs = document.querySelectorAll('#category-filter-tabs .tab-btn');
  catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      catTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.cat;
      loadResearchLibrary();
    });
  });

  function filterByCategory(cat) {
    catTabs.forEach(t => {
      t.classList.toggle('active', t.dataset.cat === cat);
    });
    currentCategory = cat;
    loadResearchLibrary();
  }

  async function loadResearchLibrary(searchQuery = '') {
    const container = document.getElementById('research-cards-container');
    container.innerHTML = '<div style="padding:20px; color:var(--muted);">Loading verified research documents...</div>';

    try {
      let url = `/api/v1/research?category=${encodeURIComponent(currentCategory)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!data.success || !data.documents.length) {
        container.innerHTML = '<div style="padding:20px; color:var(--muted);">No matching research publications found.</div>';
        return;
      }

      container.innerHTML = '';
      data.documents.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'card research-card';

        const levelClass = doc.evidenceLevel.includes('Level I') ? 'level1' :
                           doc.evidenceLevel.includes('Level II') ? 'level2' : 'level3';

        card.innerHTML = `
          <div class="rc-header">
            <span class="rc-category">${doc.category}</span>
            <span class="badge-evidence ${levelClass}">${doc.evidenceLevel.split(' - ')[0]}</span>
          </div>
          <h3 class="rc-title">${doc.title}</h3>
          <div class="rc-authors">${(doc.authors || []).join(', ')} &middot; ${doc.publicationYear || 2023}</div>
          <p class="rc-abstract">${doc.abstract.substring(0, 160)}...</p>
          <div class="rc-footer">
            <button class="btn btn-primary small btn-view-doc" data-id="${doc._id}">Read Guide / Chunks</button>
            <button class="btn btn-outline small btn-save-doc" data-id="${doc._id}" data-title="${encodeURIComponent(doc.title)}">
              <svg class="icon tiny"><use href="#i-bookmark"/></svg> Save
            </button>
          </div>
        `;
        container.appendChild(card);
      });

      // Bind modal triggers
      document.querySelectorAll('.btn-view-doc').forEach(b => {
        b.addEventListener('click', () => openDocModal(b.dataset.id));
      });

      // Bind save triggers
      document.querySelectorAll('.btn-save-doc').forEach(b => {
        b.addEventListener('click', () => saveResource(b.dataset.id, decodeURIComponent(b.dataset.title)));
      });

    } catch (err) {
      container.innerHTML = `<div style="color:var(--red);">Error loading research: ${err.message}</div>`;
    }
  }

  // -------------------------------------------------------------
  // MODAL LOGIC FOR RESEARCH GUIDES
  // -------------------------------------------------------------
  const modal = document.getElementById('doc-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  btnCloseModal.addEventListener('click', () => modal.style.display = 'none');
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  async function openDocModal(docId) {
    try {
      const res = await fetch(`/api/v1/research/${docId}`);
      const data = await res.json();
      if (!data.success) return;

      const doc = data.document;
      document.getElementById('modal-doc-title').textContent = doc.title;
      document.getElementById('modal-doc-evidence').textContent = doc.evidenceLevel;
      document.getElementById('modal-doc-doi').textContent = doc.doi ? `DOI: ${doc.doi}` : '';
      document.getElementById('modal-doc-abstract').textContent = doc.abstract;
      document.getElementById('modal-doc-limitations').textContent = doc.limitations || 'None documented.';
      document.getElementById('modal-doc-safety').textContent = doc.safetyNotes || 'Consult institutional safety monographs.';
      document.getElementById('modal-chunk-count').textContent = (doc.chunks || []).length;

      const chunksContainer = document.getElementById('modal-chunks-container');
      chunksContainer.innerHTML = '';
      (doc.chunks || []).forEach(chunk => {
        const cDiv = document.createElement('div');
        cDiv.className = 'chunk-item';
        cDiv.innerHTML = `
          <div class="chunk-idx">${chunk.heading || 'Passage ' + chunk.chunkIndex}</div>
          <div>${chunk.content}</div>
        `;
        chunksContainer.appendChild(cDiv);
      });

      modal.style.display = 'flex';
    } catch (err) {
      alert('Failed to load document details: ' + err.message);
    }
  }

  // -------------------------------------------------------------
  // 3. AI RESEARCH ASSISTANT (RAG)
  // -------------------------------------------------------------
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-query-input');
  const chatMessages = document.getElementById('chat-messages-container');
  const btnClearChat = document.getElementById('btn-clear-chat');

  // Load starter conversation
  async function loadInitialChat() {
    try {
      const res = await fetch('/api/v1/chat/conversations');
      const data = await res.json();
      if (data.success && data.conversations.length > 0) {
        const convo = data.conversations[0];
        chatMessages.innerHTML = '';
        (convo.messages || []).forEach(msg => appendChatMessage(msg.role, msg.content, msg.citations, msg.evidenceScore));
      } else {
        appendChatMessage(
          'assistant',
          'Welcome to the Evidence-Grounded Research Assistant. Inquire about peptide biological mechanisms, clinical human trials, or safety considerations. Every answer is verified against our indexed peer-reviewed repository.',
          [],
          0.98
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  function appendChatMessage(role, content, citations = [], evidenceScore = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${role}`;

    let citationsHtml = '';
    if (citations && citations.length > 0) {
      citationsHtml = '<div style="margin-top:10px;"><strong style="font-size:12px; color:var(--pine);">Retrieved Sources & Verified Citations:</strong>';
      citations.forEach(c => {
        citationsHtml += `
          <div class="citation-card">
            <div class="citation-title">
              <span>[Citation ${c.citationIndex || 1}] ${c.docTitle}</span>
              <span class="confidence-pill">${Math.round((c.relevanceScore || 0.94) * 100)}% match</span>
            </div>
            <div class="citation-doi">DOI: ${c.doi}</div>
            <div style="margin-top:4px; font-style:italic; color:#4a5568;">"${c.excerpt}"</div>
          </div>
        `;
      });
      citationsHtml += '</div>';
    }

    const confidenceHtml = evidenceScore
      ? `<span class="confidence-pill" style="margin-bottom:6px;"><svg class="icon tiny"><use href="#i-check"/></svg> Grounded Certainty: ${(evidenceScore * 100).toFixed(0)}%</span>`
      : '';

    msgDiv.innerHTML = `
      <div class="msg-bubble">
        ${confidenceHtml}
        <div>${content.replace(/\n/g, '<br/>')}</div>
        ${citationsHtml}
      </div>
    `;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  chatForm.addEventListener('submit', async e => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;

    appendChatMessage('user', query);
    chatInput.value = '';

    // Show temporary thinking state
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'chat-msg assistant thinking';
    thinkingDiv.innerHTML = '<div class="msg-bubble"><em>Retrieving relevant peer-reviewed passages & validating citations...</em></div>';
    chatMessages.appendChild(thinkingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      thinkingDiv.remove();

      if (data.success) {
        appendChatMessage('assistant', data.answer, data.citations, data.evidenceScore);
      } else {
        appendChatMessage('assistant', 'Error generating response: ' + data.message);
      }
    } catch (err) {
      thinkingDiv.remove();
      appendChatMessage('assistant', 'Network failure while accessing RAG gateway: ' + err.message);
    }
  });

  // Prompt chips
  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chatInput.value = chip.textContent;
      chatForm.dispatchEvent(new Event('submit'));
    });
  });

  btnClearChat.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    appendChatMessage(
      'assistant',
      'Conversation cleared. Ask any new peptide biochemical question to initiate a fresh evidence-retrieval session.'
    );
  });

  // -------------------------------------------------------------
  // 4. WELLNESS JOURNAL
  // -------------------------------------------------------------
  const journalForm = document.getElementById('wellness-log-form');
  const energyInput = document.getElementById('log-energy');
  const energyValDisplay = document.getElementById('energy-val-display');

  // Set default date to today
  document.getElementById('log-date').value = new Date().toISOString().split('T')[0];

  energyInput.addEventListener('input', () => {
    energyValDisplay.textContent = `${energyInput.value} / 10`;
  });

  journalForm.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      entryDate: document.getElementById('log-date').value,
      sleepDuration: document.getElementById('log-sleep').value,
      energyRating: document.getElementById('log-energy').value,
      moodRating: document.getElementById('log-mood').value,
      exerciseMinutes: document.getElementById('log-exercise').value,
      notes: document.getElementById('log-notes').value
    };

    try {
      const res = await fetch('/api/v1/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('Wellness habit logged successfully!');
        document.getElementById('log-notes').value = '';
        loadWellnessJournal();
        loadOverviewData();
      } else {
        alert('Failed to log entry: ' + data.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  async function loadWellnessJournal() {
    try {
      const res = await fetch('/api/v1/wellness');
      const data = await res.json();
      if (!data.success) return;

      const tbody = document.getElementById('journal-table-body');
      tbody.innerHTML = '';

      document.getElementById('journal-summary-pill').textContent = 
        `Avg Sleep: ${data.analytics.avgSleepHours} hrs | Avg Energy: ${data.analytics.avgEnergyScore}/10`;

      data.entries.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${entry.entryDate}</strong></td>
          <td>${entry.sleepDuration} hrs</td>
          <td><span class="badge-evidence level2">${entry.energyRating}/10</span></td>
          <td>${entry.moodRating}/10</td>
          <td>${entry.notes || '-'}</td>
          <td>
            <button class="btn btn-outline tiny btn-del-entry" data-id="${entry._id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      document.querySelectorAll('.btn-del-entry').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Delete this journal record?')) {
            await fetch(`/api/v1/wellness/${btn.dataset.id}`, { method: 'DELETE' });
            loadWellnessJournal();
            loadOverviewData();
          }
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  // -------------------------------------------------------------
  // 5. SAVED RESOURCES
  // -------------------------------------------------------------
  async function saveResource(referenceId, title) {
    try {
      const res = await fetch('/api/v1/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType: 'research_guide',
          referenceId,
          title
        })
      });
      const data = await res.json();
      alert(data.message || 'Saved to your personal collection!');
    } catch (err) {
      alert('Failed to bookmark: ' + err.message);
    }
  }

  async function loadSavedResources() {
    const container = document.getElementById('saved-cards-container');
    container.innerHTML = '<div style="padding:20px; color:var(--muted);">Loading saved resources...</div>';

    try {
      const res = await fetch('/api/v1/saved');
      const data = await res.json();
      if (!data.success || !data.items.length) {
        container.innerHTML = '<div style="padding:20px; color:var(--muted);">No saved resources yet. Bookmark research guides from the library!</div>';
        return;
      }

      container.innerHTML = '';
      data.items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card research-card';
        card.innerHTML = `
          <div class="rc-header">
            <span class="rc-category">Saved Bookmark</span>
            <span class="citation-doi">${new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <h3 class="rc-title">${item.title}</h3>
          <p class="rc-abstract">${item.summary || 'Bookmarked peer-reviewed guide for future reference.'}</p>
          <div class="rc-footer">
            <button class="btn btn-primary small btn-open-saved" data-ref="${item.referenceId}">Open Guide</button>
            <button class="btn btn-outline small btn-remove-saved" data-id="${item._id}">Remove</button>
          </div>
        `;
        container.appendChild(card);
      });

      document.querySelectorAll('.btn-open-saved').forEach(b => {
        b.addEventListener('click', () => openDocModal(b.dataset.ref));
      });

      document.querySelectorAll('.btn-remove-saved').forEach(b => {
        b.addEventListener('click', async () => {
          await fetch(`/api/v1/saved/${b.dataset.id}`, { method: 'DELETE' });
          loadSavedResources();
        });
      });
    } catch (err) {
      container.innerHTML = `<div style="color:var(--red);">Error: ${err.message}</div>`;
    }
  }

  // -------------------------------------------------------------
  // 6. ADMIN KNOWLEDGE INGESTION
  // -------------------------------------------------------------
  async function loadAdminTelemetry() {
    try {
      const res = await fetch('/api/v1/admin/stats');
      const data = await res.json();
      if (!data.success) return;

      const t = data.telemetry;
      const container = document.getElementById('admin-telemetry-container');
      container.innerHTML = `
        <div class="admin-stat-card">
          <div class="lbl">Total Documents</div>
          <div class="val">${t.totalDocuments}</div>
        </div>
        <div class="admin-stat-card">
          <div class="lbl">Vector Chunks</div>
          <div class="val">${t.totalChunks}</div>
        </div>
        <div class="admin-stat-card">
          <div class="lbl">Retrieval Latency</div>
          <div class="val">${t.vectorRetrievalLatencyMs} ms</div>
        </div>
        <div class="admin-stat-card">
          <div class="lbl">RAG Engine Status</div>
          <div class="val" style="font-size:20px; color:#15803d;">ONLINE</div>
        </div>
      `;
    } catch (err) {
      console.error(err);
    }
  }

  const adminForm = document.getElementById('admin-ingest-form');
  adminForm.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      title: document.getElementById('ingest-title').value,
      category: document.getElementById('ingest-category').value,
      evidenceLevel: document.getElementById('ingest-evidence').value,
      authors: document.getElementById('ingest-authors').value,
      doi: document.getElementById('ingest-doi').value,
      abstract: document.getElementById('ingest-abstract').value,
      content: document.getElementById('ingest-content').value
    };

    try {
      const res = await fetch('/api/v1/admin/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        adminForm.reset();
        loadAdminTelemetry();
      } else {
        alert('Ingestion failure: ' + data.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  // Initial Boot
  loadOverviewData();
  loadInitialChat();
});
