
import BoxGrid from "@/components/BoxGrid";
import ControlTable from "@/components/ControlTable";

const Index = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Sistema de Controle de Pré-Box</h1>
      <BoxGrid />
      <ControlTable />
    </div>
  );
};

export default Index;
