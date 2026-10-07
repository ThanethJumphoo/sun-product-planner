const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const partName = 'Part 3'; 
  const boards = await prisma.flowBoard.findMany({ where: { name: partName }});
  if (boards.length === 0) return;
  const boardId = boards[0].id;
  
  const nodes = await prisma.flowNode.findMany({ where: { flowBoardId: boardId }});
  const edges = await prisma.flowEdge.findMany({ where: { flowBoardId: boardId }});

  const findIncomingEdges = (nodeId) => edges.filter(e => e.target === nodeId);
  const findOutgoingEdges = (nodeId) => edges.filter(e => e.source === nodeId);

  const mainToCoProductMap = {}; 

  const itemNodes = nodes.filter(n => n.nodeTypeId === 3002 || n.nodeTypeId === 3001);
  for (const itemNode of itemNodes) {
    let data;
    try { data = JSON.parse(itemNode.data || '{}'); } catch(e) { continue; }
    if (data.itemCategory !== 'product') continue;

    let chosenProcessNode = null;
    let minProcessNumber = 999999;
    
    for (const edge1 of findIncomingEdges(itemNode.id)) {
      const rmNode = nodes.find(n => n.id === edge1.source);
      if (rmNode && (rmNode.nodeTypeId === 2002 || rmNode.nodeTypeId === 2001)) {
        for (const edge2 of findIncomingEdges(rmNode.id)) {
          const processNode = nodes.find(n => n.id === edge2.source);
          if (processNode && (processNode.nodeTypeId === 1004 || processNode.nodeTypeId === 1001)) {
            let pData;
            try { pData = JSON.parse(processNode.data || '{}'); } catch(e) { continue; }
            const pNum = Number(pData.Process) || 999;
            if (pNum < minProcessNumber) {
              minProcessNumber = pNum;
              chosenProcessNode = processNode;
            }
          }
        }
      }
    }

    if (!chosenProcessNode) continue;

    const processOutgoing = findOutgoingEdges(chosenProcessNode.id);
    const generatedItems = [];

    for (const outEdge of processOutgoing) {
      if (outEdge.sourceHandle === 'coproduct' || outEdge.sourceHandle === 'byproduct') {
        const targetRmNode = nodes.find(n => n.id === outEdge.target);
        if (targetRmNode) {
          let rmYieldPercent = 0;
          try {
            const rmData = JSON.parse(targetRmNode.data || '{}');
            rmYieldPercent = Number(rmData['Yield Percent']) || 0;
          } catch(e){}

          if (rmYieldPercent > 0) {
            const rmOutgoing = findOutgoingEdges(targetRmNode.id);
            for (const outEdge2 of rmOutgoing) {
              const coItemNode = nodes.find(n => n.id === outEdge2.target);
              if (coItemNode && (coItemNode.nodeTypeId === 3002 || coItemNode.nodeTypeId === 3001)) {
                let coData;
                try { coData = JSON.parse(coItemNode.data || '{}'); } catch(e) { continue; }
                if (coData.Items && Array.isArray(coData.Items)) {
                  for (const coItem of coData.Items) {
                    generatedItems.push({
                      itemCode: coItem.erpItemCode,
                      yieldPercent: rmYieldPercent
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    if (data.Items && Array.isArray(data.Items)) {
      for (const mainItem of data.Items) {
        if (!mainToCoProductMap[mainItem.erpItemCode]) {
            mainToCoProductMap[mainItem.erpItemCode] = [];
        }
        mainToCoProductMap[mainItem.erpItemCode].push(...generatedItems);
      }
    }
  }

  console.log(JSON.stringify(mainToCoProductMap, null, 2));
}

check().finally(()=>prisma.$disconnect());
