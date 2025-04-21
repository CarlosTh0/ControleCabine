import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings2, Bell, Database, Palette } from 'lucide-react';
import { SystemConfig, getConfig, updateConfig, resetConfig } from '@/lib/config';
import { applyTheme } from '@/lib/theme';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export function Settings() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const loadedConfig = await getConfig();
        setConfig(loadedConfig);
        applyTheme(loadedConfig);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const handleUpdateConfig = async (section: keyof SystemConfig, value: any) => {
    if (!config) return;

    try {
      const updatedConfig = await updateConfig({
        [section]: {
          ...config[section],
          ...value
        }
      });
      setConfig(updatedConfig);
      applyTheme(updatedConfig);
      toast.success('Configurações atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast.error('Erro ao atualizar configurações');
    }
  };

  const handleResetConfig = async () => {
    try {
      await resetConfig();
      const defaultConfig = await getConfig();
      setConfig(defaultConfig);
      applyTheme(defaultConfig);
      toast.success('Configurações restauradas com sucesso');
    } catch (error) {
      console.error('Erro ao restaurar configurações:', error);
      toast.error('Erro ao restaurar configurações');
    }
  };

  if (loading || !config) {
    return <div>Carregando configurações...</div>;
  }

  return (
    <div className="container mx-auto py-2 px-4 max-w-3xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Configurações do Sistema</h1>
        <Button variant="outline" size="sm" onClick={handleResetConfig}>
          Restaurar Padrões
        </Button>
      </div>

      <Tabs defaultValue="appearance" className="space-y-2">
        <TabsList className="grid w-full grid-cols-4 h-9">
          <TabsTrigger value="general" className="flex items-center gap-1 text-sm">
            <Settings2 className="h-3.5 w-3.5" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1 text-sm">
            <Bell className="h-3.5 w-3.5" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-1 text-sm">
            <Database className="h-3.5 w-3.5" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1 text-sm">
            <Palette className="h-3.5 w-3.5" />
            Aparência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="text-base font-medium">Configurações de Aparência</h2>
              <p className="text-xs text-muted-foreground">
                Personalize a aparência do sistema
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="theme" className="text-sm">Tema</Label>
                  <Select
                    value={config.appearance.theme}
                    onValueChange={(value) =>
                      handleUpdateConfig('appearance', { theme: value })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Selecione o tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="density" className="text-sm">Densidade do Layout</Label>
                  <Select
                    value={config.appearance.density}
                    onValueChange={(value) =>
                      handleUpdateConfig('appearance', { density: value })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Selecione a densidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compacto</SelectItem>
                      <SelectItem value="comfortable">Confortável</SelectItem>
                      <SelectItem value="spacious">Espaçoso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fontSize" className="text-sm">Tamanho da Fonte</Label>
                  <Select
                    value={config.appearance.fontSize}
                    onValueChange={(value) =>
                      handleUpdateConfig('appearance', { fontSize: value })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Selecione o tamanho da fonte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeno</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="accentColor" className="text-sm">Cor de Destaque</Label>
                  <input
                    type="color"
                    id="accentColor"
                    value={config.appearance.accentColor}
                    onChange={(e) =>
                      handleUpdateConfig('appearance', { accentColor: e.target.value })
                    }
                    className="w-full h-8 rounded-md cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="text-base font-medium">Configurações Gerais</h2>
              <p className="text-xs text-muted-foreground">
                Configure os parâmetros básicos do sistema
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-sm">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    className="h-8"
                    value={config.general.companyName}
                    onChange={(e) =>
                      handleUpdateConfig('general', { companyName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="maxBoxes" className="text-sm">Número Máximo de Boxes</Label>
                  <Input
                    id="maxBoxes"
                    type="number"
                    className="h-8"
                    value={config.general.maxBoxes}
                    onChange={(e) =>
                      handleUpdateConfig('general', { maxBoxes: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Turnos de Trabalho</Label>
                  <div className="space-y-3">
                    {Array.isArray(config?.general?.shifts) && config.general.shifts.map((shift, index) => (
                      <div key={index} className="grid gap-3 p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                          <Input
                            className="h-8 w-48"
                            value={shift.name}
                            onChange={(e) => {
                              const newShifts = [...config.general.shifts];
                              newShifts[index] = { ...shift, name: e.target.value };
                              handleUpdateConfig('general', { shifts: newShifts });
                            }}
                          />
                          <Switch
                            checked={shift.isActive}
                            onCheckedChange={(checked) => {
                              const newShifts = [...config.general.shifts];
                              newShifts[index] = { ...shift, isActive: checked };
                              handleUpdateConfig('general', { shifts: newShifts });
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-sm">Início</Label>
                            <Input
                              type="time"
                              className="h-8"
                              value={shift.start}
                              onChange={(e) => {
                                const newShifts = [...config.general.shifts];
                                newShifts[index] = { ...shift, start: e.target.value };
                                handleUpdateConfig('general', { shifts: newShifts });
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm">Término</Label>
                            <Input
                              type="time"
                              className="h-8"
                              value={shift.end}
                              onChange={(e) => {
                                const newShifts = [...config.general.shifts];
                                newShifts[index] = { ...shift, end: e.target.value };
                                handleUpdateConfig('general', { shifts: newShifts });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="autoSave" className="text-sm">Salvar Automaticamente</Label>
                  <Switch
                    id="autoSave"
                    checked={config.general.autoSave}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig('general', { autoSave: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="text-base font-medium">Configurações de Notificações</h2>
              <p className="text-xs text-muted-foreground">
                Gerencie como o sistema irá notificá-lo
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notificationsEnabled" className="text-sm">Ativar Notificações</Label>
                  <Switch
                    id="notificationsEnabled"
                    checked={config.notifications.enabled}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig('notifications', { enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="soundEnabled" className="text-sm">Som nas Notificações</Label>
                  <Switch
                    id="soundEnabled"
                    checked={config.notifications.sound}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig('notifications', { sound: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="desktopEnabled" className="text-sm">Notificações na Área de Trabalho</Label>
                  <Switch
                    id="desktopEnabled"
                    checked={config.notifications.desktop}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig('notifications', { desktop: checked })
                    }
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <Label className="text-sm font-medium">Alertas Específicos</Label>
                  <div className="ml-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="boxOccupied" className="text-sm">Box Ocupado</Label>
                      <Switch
                        id="boxOccupied"
                        checked={config.notifications.alerts.boxOccupied}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig('notifications', {
                            alerts: { ...config.notifications.alerts, boxOccupied: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="tripComplete" className="text-sm">Viagem Concluída</Label>
                      <Switch
                        id="tripComplete"
                        checked={config.notifications.alerts.tripComplete}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig('notifications', {
                            alerts: { ...config.notifications.alerts, tripComplete: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="errors" className="text-sm">Erros do Sistema</Label>
                      <Switch
                        id="errors"
                        checked={config.notifications.alerts.errors}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig('notifications', {
                            alerts: { ...config.notifications.alerts, errors: checked }
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="text-base font-medium">Configurações de Backup</h2>
              <p className="text-xs text-muted-foreground">
                Configure como o sistema irá gerenciar seus backups
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoBackup" className="text-sm">Backup Automático</Label>
                  <Switch
                    id="autoBackup"
                    checked={config.backup.autoBackup}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig('backup', { autoBackup: checked })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="frequency" className="text-sm">Frequência de Backup</Label>
                  <Select
                    value={config.backup.frequency}
                    onValueChange={(value) =>
                      handleUpdateConfig('backup', { frequency: value })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="scheduleTime" className="text-sm">Horário do Backup</Label>
                  <Input
                    id="scheduleTime"
                    type="time"
                    className="h-8"
                    value={config.backup.scheduleTime || ""}
                    onChange={(e) =>
                      handleUpdateConfig('backup', { scheduleTime: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="storageLocation" className="text-sm">Local de Armazenamento</Label>
                  <div className="flex gap-2">
                    <Input
                      id="storageLocation"
                      className="h-8 flex-1"
                      value={config.backup.storageLocation}
                      onChange={(e) =>
                        handleUpdateConfig('backup', { storageLocation: e.target.value })
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Aqui implementaremos a seleção de pasta
                        toast.info("Seleção de pasta será implementada em breve");
                      }}
                    >
                      Escolher
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="keepCount" className="text-sm">Número de Backups Mantidos</Label>
                  <Input
                    id="keepCount"
                    type="number"
                    className="h-8"
                    min="1"
                    max="30"
                    value={config.backup.keepCount}
                    onChange={(e) =>
                      handleUpdateConfig('backup', { keepCount: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="compression" className="text-sm">Compactar Backup</Label>
                  <Switch
                    id="compression"
                    checked={config.backup.compression}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig('backup', { compression: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="encryptBackup" className="text-sm">Criptografar Backup</Label>
                  <Switch
                    id="encryptBackup"
                    checked={config.backup.encryptBackup}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig('backup', { encryptBackup: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyOnComplete" className="text-sm">Notificar ao Concluir</Label>
                  <Switch
                    id="notifyOnComplete"
                    checked={config.backup.notifyOnComplete}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig('backup', { notifyOnComplete: checked })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Dados a Excluir do Backup</Label>
                  <div className="space-y-2 ml-4">
                    {['Logs', 'Configurações', 'Arquivos Temporários'].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`exclude-${item}`}
                          checked={config.backup.excludedData?.includes(item) || false}
                          onChange={(e) => {
                            const currentExcluded = config.backup.excludedData || [];
                            const newExcluded = e.target.checked
                              ? [...currentExcluded, item]
                              : currentExcluded.filter(i => i !== item);
                            handleUpdateConfig('backup', { excludedData: newExcluded });
                          }}
                        />
                        <Label htmlFor={`exclude-${item}`} className="text-sm">{item}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        toast.info("Backup manual iniciado");
                        // Aqui implementaremos o backup manual
                      }}
                    >
                      Fazer Backup Agora
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        toast.info("Restauração será implementada em breve");
                        // Aqui implementaremos a restauração
                      }}
                    >
                      Restaurar Backup
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast.info("Histórico de backups será implementado em breve");
                      // Aqui implementaremos a visualização do histórico
                    }}
                  >
                    Ver Histórico
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Restauração</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="validateBeforeRestore" className="text-sm">Validar Antes de Restaurar</Label>
                      <Switch
                        id="validateBeforeRestore"
                        checked={config.backup.validateBeforeRestore}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig('backup', { validateBeforeRestore: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="createBackupBeforeRestore" className="text-sm">Backup Antes de Restaurar</Label>
                      <Switch
                        id="createBackupBeforeRestore"
                        checked={config.backup.createBackupBeforeRestore}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig('backup', { createBackupBeforeRestore: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                {config.backup.lastBackup && (
                  <p className="text-xs text-muted-foreground">
                    Último backup: {new Date(config.backup.lastBackup).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 