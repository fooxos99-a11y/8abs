// check.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = 'https://ryseshfgerxozrbtxyqv.supabase.co/';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5c2VzaGZnZXJ4b3pyYnR4eXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODg3NzcsImV4cCI6MjA3Nzg2NDc3N30.JbUwwqamOR9YtrRKHEc9H0_QyNy8dSvQThs_fBW1zAc';
const supabase = createClient(url, key);

async function check() {
  const { count: studentsCount, error: err1 } = await supabase.from('students').select('*', { count: 'exact', head: true });
  const { count: teachersCount, error: err2 } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
  const { count: circlesCount, error: err3 } = await supabase.from('circles').select('*', { count: 'exact', head: true });
  
  console.log('Students:', studentsCount, err1);
  console.log('Teachers:', teachersCount, err2);
  console.log('Circles:', circlesCount, err3);
}

check();
