import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Chip,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import ConstructionIcon from "@mui/icons-material/Construction";
import { Link } from "react-router-dom";
import api from "../services/api";

import GeneratorModal from "../components/GeneratorModal";

function Generators() {
  const [generators, setGenerators] = useState([]);
  const [customersMap, setCustomersMap] = useState({});
  const [clients, setClients] = useState([]);

  // Para controlar abertura/fechamento do modal "Novo Gerador"
  const [open, setOpen] = useState(false);

  // Guardamos o gerador que estamos editando (ou null se for novo)
  const [editingGenerator, setEditingGenerator] = useState(null);

  // Estado principal para “preencher” o modal (substitui formData)
  const [newGenerator, setNewGenerator] = useState({
    name: "",
    serialNumber: "",
    location: "",
    purchaseDate: "",
    lastMaintenanceDate: "",
    deliveryDate: "",
    horimetroAtual: "",
    status: "disponivel",
    motor: "",
    modelo: "",
    fabricante: "",
    potencia: "",
    customerId: "",
  });

  // Sub-form: extraFields
  const [extraFields, setExtraFields] = useState([]);

  // Campo de busca
  const [searchTerm, setSearchTerm] = useState("");

  // --------------------------------------------
  // 1) BUSCAR CLIENTES E GERADORES
  // --------------------------------------------
  const fetchCustomers = async () => {
    try {
      const response = await api.post(
        "/functions/getAllCustomers",
        {},
        {
          headers: {
            "X-Parse-Session-Token": localStorage.getItem("sessionToken"),
          },
        }
      );
      if (response.data.result) {
        const cMap = {};
        response.data.result.forEach((cust) => {
          cMap[cust.objectId] = cust.name;
        });
        setCustomersMap(cMap);
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error.message);
    }
  };

  const fetchGenerators = async () => {
    try {
      const response = await api.post(
        "/functions/getAllGenerators",
        {},
        {
          headers: {
            "X-Parse-Session-Token": localStorage.getItem("sessionToken"),
          },
        }
      );
      if (response.data.result) {
        setGenerators(response.data.result);
      }
    } catch (error) {
      console.error("Erro ao buscar geradores:", error.message);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchGenerators();
    fetchClients();
    fetchInventoryItems();
  }, []);

  // Buscar lista de clientes para o dropdown
  const fetchClients = async () => {
    try {
      const response = await api.post(
        "/functions/getAllCustomers",
        {},
        {
          headers: {
            "X-Parse-Session-Token": localStorage.getItem("sessionToken"),
          },
        }
      );
      if (response.data.result) {
        setClients(response.data.result);
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error.message);
    }
  };

  // ----------------------------------------------
  // ESTADO / FUNÇÕES p/ buscar itens do estoque
  // ----------------------------------------------
  const [inventoryItems, setInventoryItems] = useState([]);

  const fetchInventoryItems = async () => {
    try {
      const sessionToken = localStorage.getItem("sessionToken") || "";
      const res = await api.post(
        "/functions/getAllInventoryItems",
        {},
        { headers: { "X-Parse-Session-Token": sessionToken } }
      );
      if (res.data.result) {
        setInventoryItems(res.data.result);
      }
    } catch (error) {
      console.error("Erro ao buscar itens do estoque:", error.message);
    }
  };

  // --------------------------------------------
  // 2) FUNÇÃO PARA ABRIR O MODAL (novo ou editar)
  // --------------------------------------------
  const handleOpen = (generator = null) => {
    if (generator) {
      // Vamos editar
      setEditingGenerator(generator);
      setNewGenerator({
        name: generator.name || "",
        serialNumber: generator.serialNumber || "",
        location: generator.location || "",
        purchaseDate: generator.purchaseDate
          ? generator.purchaseDate.slice(0, 10)
          : "",
        lastMaintenanceDate: generator.lastMaintenanceDate
          ? generator.lastMaintenanceDate.slice(0, 10)
          : "",
        deliveryDate: generator.deliveryDate
          ? generator.deliveryDate.slice(0, 10)
          : "",
        horimetroAtual: generator.horimetroAtual ?? "",
        status: generator.status || "disponivel",
        motor: generator.motor || "",
        modelo: generator.modelo || "",
        fabricante: generator.fabricante || "",
        potencia: generator.potencia || "",
        customerId: generator.customerId || "",
      });
      setExtraFields(generator.extraFields || []);
    } else {
      // Novo gerador
      setEditingGenerator(null);
      setNewGenerator({
        name: "",
        serialNumber: "",
        location: "",
        purchaseDate: "",
        lastMaintenanceDate: "",
        deliveryDate: "",
        horimetroAtual: "",
        status: "disponivel",
        motor: "",
        modelo: "",
        fabricante: "",
        potencia: "",
        customerId: "",
      });
      setExtraFields([]);
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // --------------------------------------------
  // 3) SALVAR (Create ou Update)
  // --------------------------------------------
  const handleSave = async () => {
    try {
      // Se status for "Vendido", exigir cliente
      if (newGenerator.status === "Vendido" && !newGenerator.customerId) {
        alert("É obrigatório informar o cliente ao vender o gerador.");
        return;
      }

      const payload = { ...newGenerator, extraFields };

      if (editingGenerator) {
        // Update
        await api.post(
          "/functions/updateGenerator",
          {
            generatorId: editingGenerator.objectId,
            ...payload,
          },
          {
            headers: {
              "X-Parse-Session-Token": localStorage.getItem("sessionToken"),
            },
          }
        );
      } else {
        // Create
        await api.post("/functions/createGenerator", payload, {
          headers: {
            "X-Parse-Session-Token": localStorage.getItem("sessionToken"),
          },
        });
      }

      fetchGenerators();
      handleClose();
    } catch (error) {
      console.error(
        "Erro ao salvar gerador:",
        error.response?.data || error.message
      );
    }
  };

  // --------------------------------------------
  // 4) SOFT DELETE
  // --------------------------------------------
  const handleDelete = async (generatorId) => {
    if (!window.confirm("Tem certeza que deseja excluir este gerador?"))
      return;
    try {
      await api.post(
        "/functions/softDeleteGenerator",
        { generatorId },
        {
          headers: {
            "X-Parse-Session-Token": localStorage.getItem("sessionToken"),
          },
        }
      );
      fetchGenerators();
    } catch (error) {
      console.error("Erro ao excluir gerador:", error.message);
    }
  };

  // --------------------------------------------
  // 5) LÓGICA SUB-FORM EXTRA FIELDS
  // --------------------------------------------
  const addExtraField = () => {
    setExtraFields([...extraFields, { fieldName: "", fieldValue: "" }]);
  };

  const removeExtraField = (index) => {
    const updated = [...extraFields];
    updated.splice(index, 1);
    setExtraFields(updated);
  };

  const handleExtraFieldChange = (index, key, value) => {
    const updated = [...extraFields];
    updated[index][key] = value;
    setExtraFields(updated);
  };

  // --------------------------------------------
  // 6) Peças de Desgaste (modal separado)
  // --------------------------------------------
  const [openPartsModal, setOpenPartsModal] = useState(false);
  const [partsGenerator, setPartsGenerator] = useState(null);
  const [generatorParts, setGeneratorParts] = useState([]);
  const [newPartData, setNewPartData] = useState({
    inventoryItemId: "",
    partName: "",
    intervalHours: "",
  });

  // Função para abrir o modal de peças de desgaste
  const handleOpenParts = async (generator) => {
    setPartsGenerator(generator);
    setOpenPartsModal(true);
    // Carregar as peças associadas a esse gerador, se desejar:
    await loadGeneratorParts(generator.objectId);
  };

  // Função para fechar o modal de peças de desgaste
  const handleCloseParts = () => {
    setOpenPartsModal(false);
    setPartsGenerator(null);
    setGeneratorParts([]);
    setNewPartData({
      inventoryItemId: "",
      partName: "",
      intervalHours: "",
    });
  };

  // Carrega as peças de desgaste do gerador específico
  const loadGeneratorParts = async (generatorId) => {
    try {
      const sessionToken = localStorage.getItem("sessionToken") || "";
      const res = await api.post(
        "/functions/getGeneratorParts",
        { generatorId },
        { headers: { "X-Parse-Session-Token": sessionToken } }
      );
      if (res.data.result) {
        setGeneratorParts(res.data.result);
      }
    } catch (error) {
      console.error("Erro ao buscar peças de desgaste:", error.message);
    }
  };

  // Adicionar nova peça de desgaste
  const handleAddGeneratorPart = async () => {
    // Se não selecionou item do estoque nem digitou partName, avisa
    if (!newPartData.inventoryItemId && !newPartData.partName) {
      alert("Selecione um item do estoque ou informe um nome de peça.");
      return;
    }
    if (!newPartData.intervalHours) {
      alert("Defina o intervalo de horas de substituição.");
      return;
    }

    try {
      const sessionToken = localStorage.getItem("sessionToken") || "";
      const payload = {
        generatorId: partsGenerator.objectId,
        intervalHours: Number(newPartData.intervalHours) || 0,
      };

      if (newPartData.inventoryItemId) {
        payload.inventoryItemId = newPartData.inventoryItemId;
      } else {
        payload.partName = newPartData.partName;
      }

      await api.post("/functions/createGeneratorPart", payload, {
        headers: { "X-Parse-Session-Token": sessionToken },
      });
      alert("Peça adicionada com sucesso!");

      setNewPartData({
        inventoryItemId: "",
        partName: "",
        intervalHours: "",
      });

      // Recarrega a lista
      loadGeneratorParts(partsGenerator.objectId);
    } catch (error) {
      console.error("Erro ao criar GeneratorPart:", error.message);
    }
  };

  // Remover peça de desgaste
  const handleDeleteGeneratorPart = async (partId) => {
    if (!window.confirm("Tem certeza que deseja remover esta peça?"))
      return;
    try {
      const sessionToken = localStorage.getItem("sessionToken") || "";
      await api.post(
        "/functions/softDeleteGeneratorPart",
        { partId },
        { headers: { "X-Parse-Session-Token": sessionToken } }
      );
      // Após remover, recarrega a listagem
      loadGeneratorParts(partsGenerator.objectId);
    } catch (error) {
      console.error("Erro ao excluir peça:", error.message);
    }
  };

  // --------------------------------------------
  // FILTRO DE BUSCA
  // --------------------------------------------
  const filteredGenerators = generators.filter((g) => {
    const lowerSearch = searchTerm.toLowerCase();
    const generatorName = (g.name || "").toLowerCase();
    const customerName = (g.customerName || "").toLowerCase();
    return (
      generatorName.includes(lowerSearch) ||
      customerName.includes(lowerSearch)
    );
  });

  // --------------------------------------------
  // RENDER
  // --------------------------------------------
  return (
    <Container maxWidth="lg">
      {/* TÍTULO E BOTÃO CRIAR */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={4}
        mb={2}
      >
        <Typography variant="h4">Geradores</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen(null)}
        >
          Novo Gerador
        </Button>
      </Box>

      {/* BARRA DE BUSCA */}
      <Box mb={2}>
        <TextField
          label="Buscar por Nome ou Cliente"
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      {/* TABELA DE GERADORES */}
      <TableContainer component={Paper} sx={{ mt: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Nome</strong>
              </TableCell>
              <TableCell>
                <strong>Cliente</strong>
              </TableCell>
              <TableCell>
                <strong>Número de Série</strong>
              </TableCell>
              <TableCell>
                <strong>Localização</strong>
              </TableCell>
              <TableCell>
                <strong>Data de Compra</strong>
              </TableCell>
              <TableCell>
                <strong>Entrega Técnica</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Ações</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredGenerators.map((generator) => (
              <TableRow key={generator.objectId}>
                <TableCell>
                  <Link
                    to={`/generator/${generator.objectId}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {generator.name}
                  </Link>
                </TableCell>
                <TableCell>{generator.customerName || "Sem Cliente"}</TableCell>
                <TableCell>
                  <Link
                    to={`/generator/${generator.objectId}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {generator.serialNumber}
                  </Link>
                </TableCell>
                <TableCell>{generator.location}</TableCell>
                <TableCell>
                  {generator.purchaseDate
                    ? new Date(generator.purchaseDate).toLocaleDateString(
                      "pt-BR"
                    )
                    : "—"}
                </TableCell>
                <TableCell>
                  {generator.deliveryDate
                    ? new Date(generator.deliveryDate).toLocaleDateString(
                      "pt-BR"
                    )
                    : "—"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      generator.status === "disponivel"
                        ? "Em estoque"
                        : generator.status === "alugado"
                          ? "Alugado"
                          : generator.status === "em manutencao"
                            ? "Em Manutenção"
                            : generator.status === "Vendido"
                              ? "Vendido"
                              : generator.status === "Terceiro"
                                ? "Terceiro"
                                : generator.status
                    }
                    color={
                      generator.status === "disponivel"
                        ? "primary"
                        : generator.status === "alugado"
                          ? "warning"
                          : generator.status === "em manutencao"
                            ? "error"
                            : generator.status === "Vendido"
                              ? "success"
                              : generator.status === "Terceiro"
                                ? "info"
                                : "default"
                    }
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar">
                    <IconButton
                      color="primary"
                      onClick={() => handleOpen(generator)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Peças de Desgaste">
                    <IconButton
                      color="secondary"
                      onClick={() => handleOpenParts(generator)}
                    >
                      <ConstructionIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Excluir">
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(generator.objectId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {filteredGenerators.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Nenhum gerador encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* -------------------------------
          CHAMADA DO NOVO MODAL
         ------------------------------- */}
      <GeneratorModal
        open={open}
        onClose={handleClose}
        onSave={handleSave}
        newGenerator={newGenerator}
        setNewGenerator={setNewGenerator}
        clients={clients}
        extraFields={extraFields}
        addExtraField={addExtraField}
        removeExtraField={removeExtraField}
        handleExtraFieldChange={handleExtraFieldChange}
      />

      {/* MODAL PARA GERENCIAR PEÇAS DE DESGASTE */}
      <Dialog open={openPartsModal} onClose={handleCloseParts} maxWidth="sm" fullWidth>
        <DialogTitle>Peças de Desgaste</DialogTitle>
        <DialogContent>
          {partsGenerator && (
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Gerador: <strong>{partsGenerator.name}</strong>
              {" - "}
              Serial: <strong>{partsGenerator.serialNumber}</strong>
            </Typography>
          )}

          {/* Listagem das peças cadastradas */}
          {generatorParts.map((part) => (
            <Box
              key={part.objectId}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography>
                <strong>{part.partName}</strong> : Intervalo: {part.intervalHours}h
                {" | "}Horas Usadas: {part.currentHours || 0}
              </Typography>
              <IconButton color="error" onClick={() => handleDeleteGeneratorPart(part.objectId)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}

          {/* Formulário para adicionar nova peça */}
          <Box
            sx={{
              mt: 2,
              p: 2,
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Adicionar Nova Peça
            </Typography>

            <TextField
              select
              label="Selecione um Item do Estoque (opcional)"
              variant="outlined"
              margin="dense"
              fullWidth
              value={newPartData.inventoryItemId}
              onChange={(e) =>
                setNewPartData({
                  ...newPartData,
                  inventoryItemId: e.target.value,
                })
              }
            >
              <MenuItem value="">
                <em>Nenhum selecionado</em>
              </MenuItem>
              {inventoryItems.map((item) => (
                <MenuItem key={item.objectId} value={item.objectId}>
                  {item.itemName} (Estoque: {item.quantity})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Intervalo de Horas"
              fullWidth
              margin="dense"
              type="number"
              value={newPartData.intervalHours}
              onChange={(e) =>
                setNewPartData({
                  ...newPartData,
                  intervalHours: e.target.value,
                })
              }
            />

            <Box sx={{ textAlign: "right", mt: 2 }}>
              <Button variant="contained" onClick={handleAddGeneratorPart}>
                Adicionar Peça
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseParts} color="secondary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Generators;
