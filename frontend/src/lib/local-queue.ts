export interface LocalJob {
  id: string;
  title: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: number;
}

export const LocalQueue = {
  getJobs(): LocalJob[] {
    if (typeof window === 'undefined') return [];
    try {
      const q = localStorage.getItem('inkto_queue');
      return q ? JSON.parse(q) : [];
    } catch { return []; }
  },
  
  addJob(id: string, title: string) {
    if (typeof window === 'undefined') return;
    const jobs = this.getJobs();
    jobs.push({ id, title, status: 'processing', createdAt: Date.now() });
    localStorage.setItem('inkto_queue', JSON.stringify(jobs));
  },
  
  updateJobStatus(id: string, status: 'processing' | 'completed' | 'failed') {
    if (typeof window === 'undefined') return;
    const jobs = this.getJobs();
    const idx = jobs.findIndex(j => j.id === id);
    if (idx !== -1) {
      jobs[idx].status = status;
      localStorage.setItem('inkto_queue', JSON.stringify(jobs));
    }
  },
  
  cleanup() {
    if (typeof window === 'undefined') return;
    const jobs = this.getJobs().filter(j => j.status === 'processing' || (Date.now() - j.createdAt < 86400000));
    localStorage.setItem('inkto_queue', JSON.stringify(jobs));
  }
};
