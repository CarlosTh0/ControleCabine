import React from 'react';
import { BoxData, ControlEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Box, Truck, PackageCheck, AlertTriangle, Clock, Calendar, BarChart3, Activity, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { twMerge } from 'tailwind-merge';

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  tableEntries: ControlEntry[];
  boxData: BoxData[];
  activeTab: string;
}

export function DashboardSidebar({ isOpen, onToggle, tableEntries, boxData, activeTab }: DashboardSidebarProps) {
  // Cálculo das estatísticas
  const stats = {
    totalBoxes: boxData.length,
    freeBoxes: boxData.filter(box => box.status === 'free').length,
    occupiedBoxes: boxData.filter(box => box.status === 'occupied').length,
    blockedBoxes: boxData.filter(box => box.status === 'blocked').length,
    todayTrips: tableEntries.filter(entry => {
      const today = new Date();
      const entryDate = new Date(entry.date);
      return entryDate.toDateString() === today.toDateString();
    }).length,
    pendingBoxes: tableEntries.filter(entry => !entry.boxInside).length,
  };

  return (
    <>
      <div
        className={twMerge(
          "fixed top-0 left-0 h-full bg-background border-r transition-all duration-300 z-50",
          isOpen ? "w-[400px]" : "w-[40px]",
          "shadow-lg"
        )}
      >
        <Button
          variant="outline"
          className={twMerge(
            "absolute -right-3 top-1/2 transform -translate-y-1/2",
            "h-24 w-6 rounded-r-xl border-l-0",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "shadow-md"
          )}
          onClick={onToggle}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        {isOpen && activeTab === 'dashboard' && (
          <div className="p-6 space-y-6 overflow-y-auto h-full">
            <div className="grid gap-6">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Boxes Livres</CardTitle>
                  <Box className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.freeBoxes}</div>
                  <p className="text-xs text-muted-foreground">
                    {((stats.freeBoxes / stats.totalBoxes) * 100).toFixed(1)}% do total
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Viagens Hoje</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayTrips}</div>
                  <p className="text-xs text-muted-foreground">
                    Registradas nas últimas 24h
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Boxes Ocupados</CardTitle>
                  <PackageCheck className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.occupiedBoxes}</div>
                  <p className="text-xs text-muted-foreground">
                    {((stats.occupiedBoxes / stats.totalBoxes) * 100).toFixed(1)}% do total
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Viagens Pendentes</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingBoxes}</div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando BOX-D
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Estatísticas do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm font-medium">Total de Boxes:</span>
                      <span className="ml-auto">{stats.totalBoxes}</span>
                    </div>
                    <div className="flex items-center">
                      <Box className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm font-medium">Boxes Livres:</span>
                      <span className="ml-auto">{stats.freeBoxes}</span>
                    </div>
                    <div className="flex items-center">
                      <PackageCheck className="h-4 w-4 mr-2 text-yellow-500" />
                      <span className="text-sm font-medium">Boxes Ocupados:</span>
                      <span className="ml-auto">{stats.occupiedBoxes}</span>
                    </div>
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                      <span className="text-sm font-medium">Boxes Bloqueados:</span>
                      <span className="ml-auto">{stats.blockedBoxes}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-purple-500" />
                      <span className="text-sm font-medium">Taxa de Ocupação:</span>
                      <span className="ml-auto">
                        {((stats.occupiedBoxes / stats.totalBoxes) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 