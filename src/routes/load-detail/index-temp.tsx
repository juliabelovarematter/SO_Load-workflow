import React, { useState, useEffect } from 'react'
import { useRoute } from 'wouter'
import { Button, Tag, Tabs, Form, Input, Select, DatePicker, InputNumber } from 'antd'
import { ArrowLeft, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'
import { generateLoadData } from '../../utils/mockData'

export const LoadDetail = () => {
  const [params] = useRoute('/load/:id')
  const [loadData, setLoadData] = useState<any>(null)
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('load-info')
  const [soMaterials, setSoMaterials] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [isEditable, setIsEditable] = useState(true)

  useEffect(() => {
    if (params?.id) {
      const data = generateLoadData(params.id)
      setLoadData(data)
      
      // Add SO materials if load has related SO
      if (data.relatedSO) {
        const soMaterialsData = [
          {
            id: 'so-1',
            contractMaterial: '101 - Aluminum Cans',
            unitPrice: 0.12,
            pricingUnit: 'lb' as const,
            soWeight: 500,
            soRemainingWeight: 450,
            requestedWeight: 450,
            estimatedTotal: 1230.90,
            source: 'so' as const
          }
        ]
        setSoMaterials(soMaterialsData)
      }
    }
  }, [params?.id])

  const handleDeleteSOMaterial = (materialId: string) => {
    const updatedSOmaterials = soMaterials.filter(material => material.id !== materialId)
    setSoMaterials(updatedSOmaterials)
    setHasChanges(true)
  }

  const handleSave = () => {
    setHasChanges(false)
  }

  const handleDiscard = () => {
    setHasChanges(false)
  }

  return (
    <div>
      <div style={{ padding: '24px' }}>
        <h1>Load Detail - {params?.id}</h1>
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="Load Info" key="load-info">
            <div>
              <h2>Load Information</h2>
              <p>Load details will go here</p>
            </div>
          </Tabs.TabPane>
          
          <Tabs.TabPane tab={`Materials (${soMaterials.length + materials.length})`} key="materials">
            <div>
              <h2>Materials</h2>
              {soMaterials.length > 0 && (
                <div>
                  <h3>SO Materials ({soMaterials.length})</h3>
                  <ul>
                    {soMaterials.map((material: any) => (
                      <li key={material.id}>
                        {material.contractMaterial} - ${material.unitPrice}/{material.pricingUnit}
                        <button 
                          onClick={() => handleDeleteSOMaterial(material.id)} 
                          disabled={!isEditable}
                          style={{ marginLeft: '10px' }}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div>
                <h3>Load Materials ({materials.length})</h3>
                {materials.length === 0 ? (
                  <div>
                    <p>No materials added yet</p>
                    <Button onClick={() => setMaterials([{ id: 1 }])}>
                      Add Material
                    </Button>
                  </div>
                ) : (
                  <p>Load materials will go here</p>
                )}
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>

        {hasChanges && (
          <div style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px',
            background: '#fff',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}>
            <Button onClick={handleDiscard} style={{ marginRight: '10px' }}>
              Discard
            </Button>
            <Button type="primary" onClick={handleSave}>
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

