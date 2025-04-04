import React, { useState, useEffect, useRef } from "react";
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Checkbox,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import SignatureCanvas from "react-signature-canvas";

const CHECKLIST_ITEMS = [
    { key: "verificarNivelLiquido", label: "Verificar e corrigir o nível do líquido de arrefecimento" },
    { key: "verificarVazamentos", label: "Verificar possíveis vazamentos" },
    { key: "verificarTampaRadiador", label: "Verificar a tampa do radiador" },
    { key: "verificarColmeiaRadiador", label: "Verificar se existe obstrução ou vazamento na colméia do radiador" },
    { key: "verificarBombaAgua", label: "Verificar estado da bomba d'água" },
    { key: "verificarCorreias", label: "Verificar estado das correias (desgaste e tensão)" },
    { key: "verificarVentiladores", label: "Verificar ventiladores (trincas, pás soltas, etc.)" },
    { key: "verificarMangueirasArrefecimento", label: "Verificar mangueiras do sistema de arrefecimento" },
    { key: "verificarGradeProtecao", label: "Verificar a fixação da grade de proteção (suporte e coxis)" },
    { key: "verificarNivelOleo", label: "Verificar e corrigir o nível do óleo lubrificante" },
    { key: "verificarVazamentoOleo", label: "Verificar possíveis vazamentos de óleo lubrificante" },
    { key: "verificarMangueirasOleo", label: "Verificar mangueiras e abraçadeiras do sistema de óleo lubrificante" },
    { key: "verificarMangueirasInjecao", label: "Verificar mangueiras e abraçadeiras do sistema de injeção" },
    { key: "verificarTanqueCombustivel", label: "Verificar estado de conservação do tanque de combustível" },
    { key: "verificarVazamentosCombustivel", label: "Verificar as conexões e possíveis vazamentos no sistema de combustível" },
    { key: "drenarSedimentosTanque", label: "Drenar sedimentos do tanque de combustível" },
    { key: "drenarSedimentosFiltros", label: "Drenar sedimentos dos filtros de combustível" },
    { key: "verificarBombaInjetora", label: "Verificar articulação da bomba injetora" },
    { key: "verificarVazamentoAdmissao", label: "Verificar possíveis vazamentos no sistema de admissão de ar" },
    { key: "verificarMangueirasAdmissao", label: "Verificar mangueiras e abraçadeiras do sistema de admissão de ar" },
    { key: "verificarTuboAlimentador", label: "Verificar tubo alimentador" },
    { key: "verificarCondicaoFiltroAr", label: "Verificar condições do filtro de ar" },
    { key: "verificarIndicadorRestricao", label: "Verificar e testar indicador de restrição do filtro de ar" },
    { key: "verificarIntercooler", label: "Verificar se o intercooler ou afc está obstruído" },
    { key: "verificarConexoesEletricas", label: "Verificar o estado das conexões elétricas do motor" },
    { key: "verificarCircuitoPreAquecimento", label: "Verificar o estado do circuito e o funcionamento do pré-aquecimento" },
    { key: "testePressostato", label: "Teste a atuação do sensor de pressão de óleo (pressostato)" },
    { key: "testeTermostato", label: "Teste a atuação do sensor de temperatura (termostato)" },
    { key: "verificarRuidoMotor", label: "Verificar possíveis ruídos anormais no motor" },
    { key: "verificarAmortecedores", label: "Verificar amortecedores" },
    { key: "verificarConexoesBateria", label: "Verificar estado de limpeza dos cabos e conectores de bateria" },
    { key: "verificarTensaoTerminaisBateria", label: "Verificar o estado de tensão e dos terminais da bateria (aplicar vaselina se necessário)" },
    { key: "verificarNivelEletronicoBateria", label: "Verificar o nível do eletrólito e carga" },
    { key: "verificarQTA", label: "Verificar estado dos disjuntores/contatores do QTA" },
    { key: "verificarLimpezaQTA", label: "Verificar e realizar a limpeza do QTA se necessário" },
    { key: "verificarEstadoAmbiente", label: "Verificar o estado do ambiente" },
    { key: "verificarLocalRestrito", label: "O local está restrito e protegido?" },
];

const CHECKLIST_ITEMS_INPUT = [
    { key: "temperaturaLiquido", label: "Temperatura do líquido de arrefecimento (Cº)" },
    { key: "pressaoOleo", label: "Pressão do óleo lubrificante (Bar)" },
    { key: "horimetro", label: "Horímetro (h)" }, // Campo obrigatório
    { key: "tensaoGerador", label: "Tensão do gerador (V)" },
    { key: "rotacaoMotor", label: "Rotação do motor (rpm)" },
    { key: "tensaoRetificador", label: "Tensão do retificador (V)" },
    { key: "tensaoMinimaBateria", label: "Tensão mínima da bateria na partida (V)" },
    { key: "tensaoRS", label: "Tensão RS (V)" },
    { key: "tensaoST", label: "Tensão ST (V)" },
    { key: "tensaoRT", label: "Tensão RT (V)" },
    { key: "correnteR", label: "Corrente R (A)" },
    { key: "correnteS", label: "Corrente S (A)" },
    { key: "correnteT", label: "Corrente T (A)" },
    { key: "potenciaKW", label: "Potência (kW)" },
    { key: "potenciaKVAr", label: "Potência (kVAr)" },
    { key: "potenciaKVA", label: "Potência (kVA)" },
    { key: "frequenciaGerador", label: "Frequência do gerador (Hz)" },
    { key: "nivelCombustivel", label: "Nível de combustível (L)" },
    { key: "pressaoCombustivel", label: "Pressão do combustível (bar)" },
    { key: "temperaturaCombustivel", label: "Temperatura do combustível (Cº)" },
    { key: "observacoes", label: "Observações" },
    { key: "localizacao", label: "Localização" },
    { key: "nomeTecnico", label: "Nome do técnico" },
    { key: "nomeCliente", label: "Nome do cliente" },
];

function AttendanceDetails() {
    const navigate = useNavigate();
    const { maintenanceId } = useParams();

    const [loading, setLoading] = useState(true);
    const [maintenanceInfo, setMaintenanceInfo] = useState(null);

    // Campos do relatório
    const [checkInTime, setCheckInTime] = useState("");
    const [checkOutTime, setCheckOutTime] = useState("");
    const [reportDescription, setReportDescription] = useState("");
    const [duration, setDuration] = useState("");

    // Checklist
    const [selectedChecklist, setSelectedChecklist] = useState([]);
    const [checklistInputs, setChecklistInputs] = useState({});

    // Peças
    const [availableParts, setAvailableParts] = useState([]);
    const [partsUsed, setPartsUsed] = useState([]);
    const [selectedPart, setSelectedPart] = useState("");

    // Upload de imagens (permite múltiplos arquivos)
    const [filesToUpload, setFilesToUpload] = useState([]);

    // Relatórios anteriores do gerador
    const [generatorReports, setGeneratorReports] = useState([]);

    // Modal de remoção de peça
    const [openConfirm, setOpenConfirm] = useState(false);
    const [confirmItemIndex, setConfirmItemIndex] = useState(-1);

    // Assinaturas
    const [signatureData, setSignatureData] = useState(null);
    const sigCanvas = useRef({});
    const [clientSignatureData, setClientSignatureData] = useState(null);
    const clientSigCanvas = useRef({});

    // Status e horários
    const [status, setStatus] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [calculatedDuration, setCalculatedDuration] = useState("");

    useEffect(() => {
        fetchMaintenanceDetails();
        fetchInventoryItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maintenanceId]);

    // Preenche o campo "horimetro" com o valor atual do gerador, se disponível
    useEffect(() => {
        if (
            maintenanceInfo &&
            maintenanceInfo.generatorId &&
            maintenanceInfo.generatorId.horimetroAtual
        ) {
            // Se ainda não houver valor definido no checklistInputs, seta o horímetro atual
            if (!checklistInputs.horimetro) {
                setChecklistInputs((prev) => ({
                    ...prev,
                    horimetro: maintenanceInfo.generatorId.horimetroAtual,
                }));
            }
        }
    }, [maintenanceInfo, checklistInputs.horimetro]);

    const fetchMaintenanceDetails = async () => {
        try {
            setLoading(true);
            const sessionToken = localStorage.getItem("sessionToken");
            if (!sessionToken) throw new Error("Sessão inválida. Faça login novamente.");
            const resp = await api.post(
                "/functions/getMaintenanceDetails",
                { maintenanceId },
                { headers: { "X-Parse-Session-Token": sessionToken } }
            );
            if (resp.data.result) {
                const data = resp.data.result;
                console.log("Dados da manutenção carregados:", data);
                setMaintenanceInfo(data);
                setStatus(data.status || "Agendada");
                setStartTime(data.startTime || "");
                setEndTime(data.endTime || "");
                setDuration(data.duration || "");
                if (data.startTime) setCheckInTime(data.startTime);
                if (data.endTime) setCheckOutTime(data.endTime);
                if (data.generatorId?.objectId) {
                    fetchGeneratorReports(data.generatorId.objectId);
                }
            } else {
                alert("Erro: Nenhum dado de manutenção encontrado.");
            }
        } catch (error) {
            console.error("Erro ao buscar detalhes da manutenção:", error);
            let errorMessage = "Erro ao buscar detalhes da manutenção.";
            if (error.response?.data?.error) {
                errorMessage += ` Detalhes: ${error.response.data.error}`;
            }
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchGeneratorReports = async (generatorId) => {
        try {
            const resp = await api.post(
                "/functions/getReportsByGenerator",
                { generatorId },
                { headers: { "X-Parse-Session-Token": localStorage.getItem("sessionToken") } }
            );
            if (resp.data.result) {
                const reports = resp.data.result.map((report) => {
                    let parsedDate = null;
                    if (report.createdAt && report.createdAt.iso) {
                        parsedDate = new Date(report.createdAt.iso);
                        if (isNaN(parsedDate)) {
                            console.warn(`Formato de data inválido para relatório ID ${report.objectId}`);
                            parsedDate = null;
                        }
                    } else if (report.createdAt && typeof report.createdAt === "string") {
                        parsedDate = new Date(report.createdAt);
                        if (isNaN(parsedDate)) {
                            console.warn(`Formato de data inválido:`, report.createdAt);
                            parsedDate = null;
                        }
                    }
                    return { ...report, createdAt: parsedDate };
                });
                setGeneratorReports(reports);
            }
        } catch (error) {
            console.error("Erro ao buscar relatórios do gerador:", error.message);
        }
    };

    const fetchInventoryItems = async () => {
        try {
            const resp = await api.post(
                "/functions/getAllInventoryItems",
                {},
                { headers: { "X-Parse-Session-Token": localStorage.getItem("sessionToken") } }
            );
            if (resp.data.result) {
                const mapped = resp.data.result.map((item) => ({
                    objectId: item.objectId,
                    name: item.itemName,
                    quantity: item.quantity || 0,
                    salePrice: item.salePrice || 0,
                }));
                setAvailableParts(mapped);
            }
        } catch (error) {
            console.error("Erro ao buscar itens do estoque:", error.message);
        }
    };

    const handleStart = async () => {
        try {
            const sessionToken = localStorage.getItem("sessionToken");
            if (!sessionToken) throw new Error("Sessão inválida. Faça login novamente.");
            const response = await api.post(
                "/functions/startMaintenance",
                { maintenanceId },
                { headers: { "X-Parse-Session-Token": sessionToken } }
            );
            if (response.data.result && response.data.result.success) {
                setStatus(response.data.result.status);
                setStartTime(response.data.result.startTime);
                setCheckInTime(response.data.result.startTime);
                alert("Atendimento iniciado com sucesso.");
            } else {
                alert("Falha ao iniciar o atendimento.");
            }
        } catch (error) {
            console.error("Erro ao iniciar atendimento:", error);
            if (error.response?.data) {
                alert(`Erro: ${error.response.data.error}`);
            } else {
                alert("Erro ao iniciar o atendimento.");
            }
        }
    };

    // Função unificada: Finaliza o atendimento e salva o relatório
    const handleFinishAndSaveReport = async () => {
        try {
            const sessionToken = localStorage.getItem("sessionToken");
            if (!sessionToken) throw new Error("Sessão inválida. Faça login novamente.");

            // 1. Finalizar o atendimento
            const finishResponse = await api.post(
                "/functions/finishMaintenance",
                { maintenanceId },
                { headers: { "X-Parse-Session-Token": sessionToken } }
            );

            if (!(finishResponse.data.result && finishResponse.data.result.success)) {
                alert("Falha ao finalizar o atendimento.");
                return;
            }

            // Atualiza os estados com os dados de finalização
            setStatus(finishResponse.data.result.status);
            setEndTime(finishResponse.data.result.endTime);
            setCalculatedDuration(finishResponse.data.result.duration);
            setCheckOutTime(finishResponse.data.result.endTime);
            setDuration(finishResponse.data.result.duration);
            alert("Atendimento finalizado com sucesso.");

            // 2. Valida os campos obrigatórios para salvar o relatório
            if (!checkInTime) {
                alert("Por favor, inicie o atendimento antes de salvar o relatório.");
                return;
            }
            if (!finishResponse.data.result.endTime) {
                alert("Por favor, finalize o atendimento antes de salvar o relatório.");
                return;
            }
            if (!reportDescription) {
                alert("Por favor, descreva o atendimento realizado.");
                return;
            }
            // Validação do horímetro
            if (!checklistInputs["horimetro"]) {
                alert("Por favor, informe o horímetro.");
                return;
            }
            if (!signatureData) {
                alert("Por favor, salve a assinatura do técnico antes de salvar o relatório.");
                return;
            }
            if (!clientSignatureData) {
                alert("Por favor, salve a assinatura do cliente antes de salvar o relatório.");
                return;
            }

            // 3. Preparar os dados para salvar o relatório
            const partsPayload = partsUsed.map((p) => ({
                itemId: p.objectId,
                quantity: p.usedQuantity || 1,
            }));

            const checklistText = selectedChecklist.join(", ");
            const checklistInputsArray = Object.entries(checklistInputs).map(
                ([key, value]) => ({ key, value })
            );

            const technicianSignatureBase64 = signatureData;
            const customerSignatureBase64 = clientSignatureData;

            // 4. Salvar o relatório
            const reportResponse = await api.post(
                "/functions/createMaintenanceReport",
                {
                    maintenanceId,
                    reportDescription,
                    partsUsed: partsPayload,
                    checkInTime,
                    checkOutTime: finishResponse.data.result.endTime,
                    duration,
                    checklistText,
                    checklistInputsArray,
                    technicianSignature: technicianSignatureBase64,
                    customerSignature: customerSignatureBase64,
                    customerId: maintenanceInfo?.generatorId?.customerId?.objectId,
                },
                { headers: { "X-Parse-Session-Token": sessionToken } }
            );

            if (reportResponse.data.result && reportResponse.data.result.report) {
                const reportId = reportResponse.data.result.report.objectId;
                for (const file of filesToUpload) {
                    await uploadAttachment(reportId, file);
                }
                // Atualiza o horímetro, se necessário
                if (checklistInputs["horimetro"]) {
                    await api.post(
                        "/functions/updateGeneratorHorimetro",
                        {
                            generatorId: maintenanceInfo.generatorId.objectId,
                            horimetroAtual: checklistInputs["horimetro"],
                        },
                        { headers: { "X-Parse-Session-Token": sessionToken } }
                    );
                }
                alert("Relatório salvo com sucesso!");
            } else {
                alert("Falha ao criar relatório.");
                return;
            }

            // 5. Redireciona para a página do técnico
            navigate("/tecnico");
        } catch (error) {
            console.error("Erro ao finalizar atendimento e salvar relatório:", error);
            let errorMessage = "Erro ao finalizar atendimento e salvar relatório.";
            if (error.response?.data?.error) {
                errorMessage += ` Detalhes: ${error.response.data.error}`;
            }
            alert(errorMessage);
        }
    };

    const handleToggleChecklist = (itemKey) => {
        if (selectedChecklist.includes(itemKey)) {
            setSelectedChecklist(selectedChecklist.filter((i) => i !== itemKey));
        } else {
            setSelectedChecklist([...selectedChecklist, itemKey]);
        }
    };

    const handleChecklistInputChange = (key, value) => {
        setChecklistInputs({ ...checklistInputs, [key]: value });
    };

    const handleAddPart = () => {
        if (selectedPart) {
            const itemData = availableParts.find((x) => x.objectId === selectedPart);
            if (itemData) {
                setPartsUsed([...partsUsed, { ...itemData, usedQuantity: 1 }]);
            }
            setSelectedPart("");
        }
    };

    const handleRemovePart = (index) => {
        setConfirmItemIndex(index);
        setOpenConfirm(true);
    };

    const confirmRemovePart = () => {
        if (confirmItemIndex >= 0 && confirmItemIndex < partsUsed.length) {
            setPartsUsed(partsUsed.filter((_, i) => i !== confirmItemIndex));
        }
        setOpenConfirm(false);
        setConfirmItemIndex(-1);
    };

    const cancelRemovePart = () => {
        setOpenConfirm(false);
        setConfirmItemIndex(-1);
    };

    const handleQuantityChange = (index, newQty) => {
        if (newQty < 1) return;
        const updated = [...partsUsed];
        updated[index].usedQuantity = newQty;
        setPartsUsed(updated);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setFilesToUpload(files);
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const uploadAttachment = async (reportId, file) => {
        const base64File = await fileToBase64(file);
        await api.post(
            "/functions/uploadMaintenanceAttachment",
            {
                reportId,
                base64File,
                fileName: file.name,
            },
            { headers: { "X-Parse-Session-Token": localStorage.getItem("sessionToken") } }
        );
    };

    const clearSignature = () => {
        sigCanvas.current.clear();
        setSignatureData(null);
    };

    const saveSignature = () => {
        if (!sigCanvas.current.isEmpty()) {
            const dataURL = sigCanvas.current.toDataURL("image/png");
            setSignatureData(dataURL);
        } else {
            alert("Por favor, desenhe sua assinatura antes de salvar.");
        }
    };

    const clearClientSignature = () => {
        clientSigCanvas.current.clear();
        setClientSignatureData(null);
    };

    const saveClientSignature = () => {
        if (!clientSigCanvas.current.isEmpty()) {
            const dataURL = clientSigCanvas.current.toDataURL("image/png");
            setClientSignatureData(dataURL);
        } else {
            alert("Por favor, desenhe a assinatura do cliente antes de salvar.");
        }
    };

    if (loading) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography>Carregando...</Typography>
                </Paper>
            </Container>
        );
    }

    if (!maintenanceInfo) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography color="error">Manutenção não encontrada.</Typography>
                    <Button variant="outlined" onClick={() => navigate("/tecnico")} sx={{ mt: 2 }}>
                        Voltar
                    </Button>
                </Paper>
            </Container>
        );
    }

    const generator = maintenanceInfo.generatorId || {};
    const customer = generator.customerId || {};
    const technician = maintenanceInfo.technicianUser || {};

    const totalPartsCost = partsUsed.reduce(
        (acc, part) => acc + part.salePrice * part.usedQuantity,
        0
    );

    return (
        <Container maxWidth="sm" sx={{ mt: 2, mb: 2 }}>
            {/* Cabeçalho */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Ordem de Serviço - {maintenanceId}</Typography>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/tecnico")}>
                        Voltar
                    </Button>
                </Box>
            </Paper>

            {/* Informações Automáticas */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography>
                    <strong>Localização:</strong> {generator.location || "Sem localização"}
                </Typography>
                <Typography>
                    <strong>Nome do Técnico:</strong> {technician.name || technician.username || "Técnico não identificado"}
                </Typography>
                <Typography>
                    <strong>Nome do Cliente:</strong> {customer.name || "Cliente não identificado"}
                </Typography>
                <Typography>
                    <strong>Status:</strong> {status}
                </Typography>
                {status === "Em andamento" && startTime && (
                    <Typography>
                        <strong>Hora de Início:</strong> {new Date(startTime).toLocaleString("pt-BR")}
                    </Typography>
                )}
                {status === "Concluída" && endTime && (
                    <>
                        <Typography>
                            <strong>Hora de Início:</strong> {new Date(startTime).toLocaleString("pt-BR")}
                        </Typography>
                        <Typography>
                            <strong>Hora de Finalização:</strong> {new Date(endTime).toLocaleString("pt-BR")}
                        </Typography>
                        <Typography>
                            <strong>Duração:</strong> {calculatedDuration || duration}
                        </Typography>
                    </>
                )}
            </Paper>

            {/* Check-in / Check-out */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    Check-in: {checkInTime ? new Date(checkInTime).toLocaleString("pt-BR") : "Não iniciado"}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mt: 1 }}>
                    Check-out: {checkOutTime ? new Date(checkOutTime).toLocaleString("pt-BR") : "Não finalizado"}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mt: 1 }}>
                    Duração: {duration || "N/A"}
                </Typography>
                <Box display="flex" gap={2} mt={2}>
                    <Button variant="contained" onClick={handleStart} disabled={status === "Em andamento" || status === "Concluída"}>
                        Iniciar Atendimento
                    </Button>
                </Box>
            </Paper>

            {/* Relatórios Anteriores */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                    Relatórios Anteriores
                </Typography>
                <List sx={{ maxHeight: 150, overflowY: "auto" }}>
                    {generatorReports.map((rep, idx) => {
                        const dateStr = rep.createdAt ? rep.createdAt.toLocaleString("pt-BR") : "Data não encontrada";
                        const partsUsedStr = (rep.partsUsed || [])
                            .map((p) => `${p.itemName}(x${p.quantity})`)
                            .join(", ");
                        return (
                            <ListItem key={idx} divider>
                                <ListItemText
                                    primary={`Data: ${dateStr}`}
                                    secondary={`Relatório: ${rep.reportDescription || ""} | Peças: ${partsUsedStr}`}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </Paper>

            {/* Relato */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                    Relato de Execução
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Descreva o atendimento realizado"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    sx={{ mb: 2 }}
                />
            </Paper>

            {/* Checklist - Itens de Marcar */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                    Checklist - Itens de Marcar
                </Typography>
                {CHECKLIST_ITEMS.map((item) => (
                    <Box key={item.key} display="flex" alignItems="center" mb={1}>
                        <Checkbox
                            checked={selectedChecklist.includes(item.key)}
                            onChange={() => handleToggleChecklist(item.key)}
                            sx={{ transform: "scale(1.5)" }}
                        />
                        <Typography>{item.label}</Typography>
                    </Box>
                ))}
            </Paper>

            {/* Checklist - Campos de Entrada */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                    Checklist - Campos de Entrada
                </Typography>
                {CHECKLIST_ITEMS_INPUT.map((inputItem) => {
                    const isHorimetro = inputItem.key === "horimetro";
                    return (
                        <Box key={inputItem.key} mb={2}>
                            <Typography sx={{ fontWeight: "bold", mb: 0.5 }}>
                                {inputItem.label}
                                {isHorimetro && " *"}
                            </Typography>
                            <TextField
                                fullWidth
                                type={isHorimetro ? "number" : "text"}
                                placeholder="Digite o valor"
                                value={checklistInputs[inputItem.key] || ""}
                                onChange={(e) => {
                                    if (isHorimetro) {
                                        const newValue = parseFloat(e.target.value);
                                        const currentHorimetro = parseFloat(maintenanceInfo.generatorId.horimetroAtual);
                                        if (newValue < currentHorimetro) {
                                            alert(
                                                "O horímetro não pode ser menor que o valor atual (" +
                                                currentHorimetro +
                                                ")."
                                            );
                                            return;
                                        }
                                    }
                                    handleChecklistInputChange(inputItem.key, e.target.value);
                                }}
                                required={isHorimetro}
                                {...(isHorimetro && {
                                    inputProps: { min: maintenanceInfo.generatorId.horimetroAtual },
                                })}
                            />
                        </Box>
                    );
                })}
            </Paper>

            {/* Peças Trocadas / Solicitadas */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                    Peças Trocadas / Solicitadas
                </Typography>
                <Box display="flex" gap={2}>
                    <FormControl fullWidth>
                        <InputLabel>Selecione a Peça</InputLabel>
                        <Select
                            value={selectedPart}
                            label="Selecione a Peça"
                            onChange={(e) => setSelectedPart(e.target.value)}
                        >
                            {availableParts.map((part) => (
                                <MenuItem key={part.objectId} value={part.objectId}>
                                    {part.name} - R$ {part.salePrice.toFixed(2)} (Estoque: {part.quantity})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" onClick={handleAddPart} disabled={!selectedPart}>
                        Adicionar
                    </Button>
                </Box>
                <List sx={{ mt: 2, maxHeight: 150, overflowY: "auto" }}>
                    {partsUsed.map((part, index) => {
                        const totalValue = part.salePrice * part.usedQuantity;
                        return (
                            <ListItem key={index} divider>
                                <ListItemText
                                    primary={`${part.name} (R$ ${part.salePrice.toFixed(2)} un.)`}
                                    secondary={`Qtde: ${part.usedQuantity} | Total: R$ ${totalValue.toFixed(2)}`}
                                />
                                <IconButton onClick={() => handleQuantityChange(index, part.usedQuantity - 1)}>
                                    -
                                </IconButton>
                                <IconButton onClick={() => handleQuantityChange(index, part.usedQuantity + 1)}>
                                    +
                                </IconButton>
                                <IconButton edge="end" color="error" onClick={() => handleRemovePart(index)}>
                                    <DeleteIcon />
                                </IconButton>
                            </ListItem>
                        );
                    })}
                </List>
                <Typography sx={{ mt: 2, fontWeight: "bold" }}>
                    Valor Total das Peças: R$ {totalPartsCost.toFixed(2)}
                </Typography>
            </Paper>

            {/* Upload de Imagens */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    Anexar Imagens
                </Typography>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ marginTop: "8px" }}
                />
            </Paper>

            {/* Assinatura do Técnico */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                    Assinatura do Técnico
                </Typography>
                <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ width: 500, height: 200, className: "sigCanvas" }}
                />
                <Box mt={2} display="flex" gap={2}>
                    <Button variant="outlined" onClick={clearSignature}>
                        Limpar Assinatura
                    </Button>
                    <Button variant="contained" onClick={saveSignature}>
                        Salvar Assinatura
                    </Button>
                </Box>
                {signatureData && (
                    <Box mt={2}>
                        <Typography variant="subtitle2">Assinatura do Técnico Salva:</Typography>
                        <img
                            src={`data:image/png;base64,${signatureData}`}
                            alt="Assinatura do Técnico"
                            style={{ maxWidth: "100%", height: "auto" }}
                        />
                    </Box>
                )}
            </Paper>

            {/* Assinatura do Cliente */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                    Assinatura do Cliente
                </Typography>
                <SignatureCanvas
                    ref={clientSigCanvas}
                    penColor="blue"
                    canvasProps={{ width: 500, height: 200, className: "clientSigCanvas" }}
                />
                <Box mt={2} display="flex" gap={2}>
                    <Button variant="outlined" onClick={clearClientSignature}>
                        Limpar Assinatura
                    </Button>
                    <Button variant="contained" onClick={saveClientSignature}>
                        Salvar Assinatura
                    </Button>
                </Box>
                {clientSignatureData && (
                    <Box mt={2}>
                        <Typography variant="subtitle2">Assinatura do Cliente Salva:</Typography>
                        <img
                            src={`data:image/png;base64,${clientSignatureData}`}
                            alt="Assinatura do Cliente"
                            style={{ maxWidth: "100%", height: "auto" }}
                        />
                    </Box>
                )}
            </Paper>

            {/* Botão Único de Finalizar Atendimento */}
            <Box textAlign="center" mb={3}>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleFinishAndSaveReport}
                    disabled={!checkInTime || status === "Concluída"}
                >
                    Finalizar Atendimento
                </Button>
            </Box>

            {/* Modal para Remover Peça */}
            <Dialog open={openConfirm} onClose={cancelRemovePart}>
                <DialogTitle>Remover Peça</DialogTitle>
                <DialogContent>Deseja remover esta peça da lista?</DialogContent>
                <DialogActions>
                    <Button onClick={cancelRemovePart} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={confirmRemovePart} color="error" variant="contained">
                        Remover
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default AttendanceDetails;
