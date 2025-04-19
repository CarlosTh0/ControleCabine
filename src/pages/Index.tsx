import React, { useState, useEffect } from 'react';
import ControlTable from "@/components/ControlTable";
import BoxGrid from "@/components/BoxGrid";
import Dashboard from "@/components/Dashboard";
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { ControlEntry as SupabaseControlEntry, BoxData as SupabaseBoxData } from '@/lib/supabase';
import { ControlEntry, BoxData } from '@/types';

export default function Index() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'prebox' | 'trip'>('prebox');
  const [tableEntries, setTableEntries] = useState<ControlEntry[]>([]);
  const [boxData, setBoxData] = useState<BoxData[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Função para converter SupabaseControlEntry para ControlEntry
  const convertSupabaseToControlEntry = (entry: SupabaseControlEntry): ControlEntry => ({
    date: new Date(entry.created_at).toLocaleDateString('pt-BR'),
    time: '',
    oldTrip: '',
    preBox: entry.pre_box.toString(),
    boxInside: '',
    quantity: entry.quantity.toString(),
    shift: entry.shift.toString(),
    cargoType: '',
    region: entry.region,
    status: '',
    manifestDate: '',
    trip: entry.trip
  });

  // Função para converter SupabaseBoxData para BoxData
  const convertSupabaseToBoxData = (box: SupabaseBoxData): BoxData => ({
    id: box.id,
    trip: box.trip,
    status: box.status,
    lastUpdate: box.created_at
  });

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      // Carregar entradas da tabela
      const { data: entries, error: entriesError } = await supabase
        .from('control_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (entriesError) {
        console.error('Erro ao carregar entradas:', entriesError);
        return;
      }

      if (entries) {
        setTableEntries(entries.map(convertSupabaseToControlEntry));
      }

      // Carregar dados dos boxes
      const { data: boxes, error: boxesError } = await supabase
        .from('box_data')
        .select('*')
        .order('id');

      if (boxesError) {
        console.error('Erro ao carregar boxes:', boxesError);
        return;
      }

      if (boxes) {
        setBoxData(boxes.map(convertSupabaseToBoxData));
      }
    };

    loadData();
  }, []);

  // Sincronizar dados em tempo real
  useEffect(() => {
    const controlEntriesSubscription = supabase
      .channel('control_entries_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'control_entries' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTableEntries(prev => [convertSupabaseToControlEntry(payload.new as SupabaseControlEntry), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedEntry = payload.new as SupabaseControlEntry;
            setTableEntries(prev => prev.map(entry => 
              entry.trip === updatedEntry.trip && entry.preBox === updatedEntry.pre_box.toString() 
                ? convertSupabaseToControlEntry(updatedEntry) 
                : entry
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedEntry = payload.old as SupabaseControlEntry;
            setTableEntries(prev => prev.filter(entry => 
              entry.trip !== deletedEntry.trip || entry.preBox !== deletedEntry.pre_box.toString()
            ));
          }
        }
      )
      .subscribe();

    const boxDataSubscription = supabase
      .channel('box_data_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'box_data' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBoxData(prev => [...prev, convertSupabaseToBoxData(payload.new as SupabaseBoxData)]);
          } else if (payload.eventType === 'UPDATE') {
            setBoxData(prev => prev.map(box => 
              box.id === payload.new.id ? convertSupabaseToBoxData(payload.new as SupabaseBoxData) : box
            ));
          } else if (payload.eventType === 'DELETE') {
            setBoxData(prev => prev.filter(box => box.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      controlEntriesSubscription.unsubscribe();
      boxDataSubscription.unsubscribe();
    };
  }, []);

  const handleViewChange = (view: 'dashboard' | 'prebox' | 'trip') => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        onViewChange={handleViewChange} 
        isOpen={isSidebarOpen}
        tableEntries={tableEntries}
        boxData={boxData}
      />
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <div className="p-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-background border"
          >
            {isSidebarOpen ? '←' : '→'}
          </button>

          {currentView === 'dashboard' && (
            <Dashboard tableEntries={tableEntries} boxData={boxData} />
          )}

          {currentView === 'prebox' && (
            <BoxGrid
              tableEntries={tableEntries}
              onBoxDataChange={setBoxData}
              initialBoxData={boxData}
            />
          )}

          {currentView === 'trip' && (
            <ControlTable
              entries={tableEntries}
              onEntriesChange={setTableEntries}
              availablePreBoxes={boxData
                .filter(box => box.status === 'free')
                .map(box => parseInt(box.id))
                .sort((a, b) => a - b)
              }
              tableTitle="Controle de Viagem"
              boxData={boxData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
