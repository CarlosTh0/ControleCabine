
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ControlEntry {
  date: string;
  trip: string;
  time: string;
  oldTrip: string;
  km: string;
  fleet: string;
  preBox: string;
  boxInside: string;
  quantity: number;
  shift: number;
  cargoType: string;
  region: string;
  status: string;
  exchange: string;
  manifestDate: string;
  scheduled: string;
}

const ControlTable = () => {
  const entries: ControlEntry[] = [
    {
      date: "01/02/2025",
      trip: "AUTOPORT",
      time: "6:06",
      oldTrip: "",
      km: "",
      fleet: "",
      preBox: "",
      boxInside: "AP1",
      quantity: 11,
      shift: 1,
      cargoType: "Distribuição",
      region: "AP",
      status: "",
      exchange: "",
      manifestDate: "01/02/2025",
      scheduled: "",
    },
    // Add more entries as needed
  ];

  return (
    <div className="border rounded-lg bg-white mt-8 shadow-sm">
      <h2 className="text-xl font-semibold p-4">Controle de Pré-Box</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Viagem</TableHead>
              <TableHead>Horas</TableHead>
              <TableHead>Viagem Antiga</TableHead>
              <TableHead>KM</TableHead>
              <TableHead>Frota</TableHead>
              <TableHead>Pré Box</TableHead>
              <TableHead>Box Dentro</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Tipo de Carga</TableHead>
              <TableHead>Região</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Troca</TableHead>
              <TableHead>Data Prev. Manifesto</TableHead>
              <TableHead>Agendada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={index}>
                <TableCell>{entry.date}</TableCell>
                <TableCell>{entry.trip}</TableCell>
                <TableCell>{entry.time}</TableCell>
                <TableCell>{entry.oldTrip}</TableCell>
                <TableCell>{entry.km}</TableCell>
                <TableCell>{entry.fleet}</TableCell>
                <TableCell>{entry.preBox}</TableCell>
                <TableCell>{entry.boxInside}</TableCell>
                <TableCell>{entry.quantity}</TableCell>
                <TableCell>{entry.shift}</TableCell>
                <TableCell>{entry.cargoType}</TableCell>
                <TableCell>{entry.region}</TableCell>
                <TableCell>{entry.status}</TableCell>
                <TableCell>{entry.exchange}</TableCell>
                <TableCell>{entry.manifestDate}</TableCell>
                <TableCell>{entry.scheduled}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ControlTable;
