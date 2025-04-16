
import BoxGrid from "@/components/BoxGrid";
import ControlTable from "@/components/ControlTable";

const Index = () => {
  return (
    <div className="container mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">Sistema de Controle de Pré-Box</h1>
      <BoxGrid />
      <ControlTable />
    </div>
  );
};

export default Index;
